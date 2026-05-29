package com.musix.audioengine

import android.app.Activity
import android.content.Intent
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.provider.DocumentsContract
import androidx.documentfile.provider.DocumentFile
import com.facebook.react.bridge.*
import com.musix.audioengine.NativeScannerModuleSpec
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.security.MessageDigest

class MusixScannerModule(context: ReactApplicationContext) :
    NativeScannerModuleSpec(context), ActivityEventListener {

    private var importPromise: Promise? = null
    private var folderPromise: Promise? = null
    private var pickingFolder = false

    init {
        context.addActivityEventListener(this)
    }

    override fun getName() = NAME

    private fun musicDir(): File {
        val dir = File(reactApplicationContext.getExternalFilesDir(null), "Music")
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    override fun importFiles(promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.resolve(Arguments.createArray())
            return
        }
        importPromise = promise
        pickingFolder = false
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "audio/*"
            putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
        }
        activity.startActivityForResult(intent, REQUEST_IMPORT)
    }

    override fun getMetadata(filePath: String, promise: Promise) {
        Thread {
            try {
                val retriever = MediaMetadataRetriever()
                retriever.setDataSource(filePath)

                val title = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_TITLE)
                    ?: File(filePath).nameWithoutExtension
                val artist = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ARTIST)
                    ?: "Unknown Artist"
                val album = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ALBUM)
                    ?: "Unknown Album"
                val yearStr = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_YEAR)
                val genre = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_GENRE)
                    ?: "Other"
                val durationStr = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)
                val artworkBytes = retriever.embeddedPicture
                retriever.release()

                val durationSec = (durationStr?.toLongOrNull() ?: 0L) / 1000.0
                val file = File(filePath)
                val fileSize = file.length()
                val bitrate = if (durationSec > 0) ((fileSize * 8.0) / durationSec / 1000.0).toInt() else 0
                val hue = hueForAlbum(album)

                val artworkPath = saveArtwork(filePath, artworkBytes)

                val json = JSONObject().apply {
                    put("title", title)
                    put("artist", artist)
                    put("album", album)
                    put("year", yearStr?.toIntOrNull() ?: 0)
                    put("genre", genre)
                    put("duration", durationSec)
                    put("bitrate", bitrate)
                    put("filePath", filePath)
                    put("fileSize", fileSize)
                    put("codec", "flac")
                    put("hue", hue)
                    put("artworkPath", artworkPath ?: JSONObject.NULL)
                }
                promise.resolve(json.toString())
            } catch (e: Exception) {
                promise.reject("METADATA_ERROR", e.message)
            }
        }.start()
    }

    override fun scanFolder(bookmarkId: String, promise: Promise) {
        val prefs = reactApplicationContext.getSharedPreferences(PREFS_NAME, 0)
        val uriStr = prefs.getString("folder_uri_$bookmarkId", null)
        if (uriStr == null) {
            promise.resolve(Arguments.createArray())
            return
        }

        Thread {
            try {
                val treeUri = Uri.parse(uriStr)
                val docFile = DocumentFile.fromTreeUri(reactApplicationContext, treeUri)
                val results = Arguments.createArray()
                val musicDir = musicDir()

                docFile?.listFiles()?.forEach { file ->
                    if (file.isFile && file.name?.lowercase()?.endsWith(".flac") == true) {
                        val dest = File(musicDir, file.name!!)
                        if (!dest.exists()) {
                            reactApplicationContext.contentResolver.openInputStream(file.uri)?.use { input ->
                                dest.outputStream().use { output -> input.copyTo(output) }
                            }
                        }
                        if (dest.exists()) results.pushString(dest.absolutePath)
                    }
                }
                promise.resolve(results)
            } catch (e: Exception) {
                promise.reject("SCAN_ERROR", e.message)
            }
        }.start()
    }

    override fun addWatchedFolder(promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.resolve("")
            return
        }
        folderPromise = promise
        pickingFolder = true
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT_TREE)
        activity.startActivityForResult(intent, REQUEST_FOLDER)
    }

    override fun removeWatchedFolder(bookmarkId: String) {
        val prefs = reactApplicationContext.getSharedPreferences(PREFS_NAME, 0)
        val uriStr = prefs.getString("folder_uri_$bookmarkId", null)
        if (uriStr != null) {
            try {
                val uri = Uri.parse(uriStr)
                reactApplicationContext.contentResolver.releasePersistableUriPermission(
                    uri, Intent.FLAG_GRANT_READ_URI_PERMISSION
                )
            } catch (_: Exception) {}
        }
        prefs.edit()
            .remove("folder_uri_$bookmarkId")
            .remove("folder_path_$bookmarkId")
            .apply()
        rebuildFolderList(prefs)
    }

    override fun getWatchedFolders(): String {
        val prefs = reactApplicationContext.getSharedPreferences(PREFS_NAME, 0)
        val ids = prefs.getStringSet("folder_ids", emptySet()) ?: emptySet()
        val arr = JSONArray()
        for (id in ids) {
            val path = prefs.getString("folder_path_$id", "") ?: ""
            arr.put(JSONObject().apply {
                put("id", id)
                put("path", path)
            })
        }
        return arr.toString()
    }

    override fun onActivityResult(activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?) {
        if (resultCode != Activity.RESULT_OK || data == null) {
            if (pickingFolder) {
                folderPromise?.resolve("")
                folderPromise = null
            } else {
                importPromise?.resolve(Arguments.createArray())
                importPromise = null
            }
            return
        }

        when (requestCode) {
            REQUEST_IMPORT -> handleImportResult(data)
            REQUEST_FOLDER -> handleFolderResult(data)
        }
    }

    override fun onNewIntent(intent: Intent?) {}

    private fun handleImportResult(data: Intent) {
        Thread {
            val results = Arguments.createArray()
            val musicDir = musicDir()
            val resolver = reactApplicationContext.contentResolver
            val uris = mutableListOf<Uri>()

            data.clipData?.let { clip ->
                for (i in 0 until clip.itemCount) uris.add(clip.getItemAt(i).uri)
            } ?: data.data?.let { uris.add(it) }

            for (uri in uris) {
                try {
                    val name = getFileName(uri) ?: continue
                    if (!name.lowercase().endsWith(".flac")) continue
                    val dest = File(musicDir, name)
                    if (!dest.exists()) {
                        resolver.openInputStream(uri)?.use { input ->
                            dest.outputStream().use { output -> input.copyTo(output) }
                        }
                    }
                    if (dest.exists()) results.pushString(dest.absolutePath)
                } catch (_: Exception) {}
            }

            importPromise?.resolve(results)
            importPromise = null
        }.start()
    }

    private fun handleFolderResult(data: Intent) {
        val uri = data.data
        if (uri == null) {
            folderPromise?.resolve("")
            folderPromise = null
            return
        }

        reactApplicationContext.contentResolver.takePersistableUriPermission(
            uri, Intent.FLAG_GRANT_READ_URI_PERMISSION
        )

        val bookmarkId = java.util.UUID.randomUUID().toString()
        val path = uri.lastPathSegment ?: uri.toString()
        val prefs = reactApplicationContext.getSharedPreferences(PREFS_NAME, 0)
        val ids = (prefs.getStringSet("folder_ids", emptySet()) ?: emptySet()).toMutableSet()
        ids.add(bookmarkId)
        prefs.edit()
            .putStringSet("folder_ids", ids)
            .putString("folder_uri_$bookmarkId", uri.toString())
            .putString("folder_path_$bookmarkId", path)
            .apply()

        folderPromise?.resolve(bookmarkId)
        folderPromise = null
    }

    private fun getFileName(uri: Uri): String? {
        val cursor = reactApplicationContext.contentResolver.query(uri, null, null, null, null)
        cursor?.use {
            if (it.moveToFirst()) {
                val idx = it.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
                if (idx >= 0) return it.getString(idx)
            }
        }
        return uri.lastPathSegment
    }

    private fun artworkDir(): File {
        val dir = File(reactApplicationContext.getExternalFilesDir(null), "Artwork")
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    private fun saveArtwork(filePath: String, artworkBytes: ByteArray?): String? {
        if (artworkBytes == null) return null
        val baseName = File(filePath).nameWithoutExtension
        val dest = File(artworkDir(), "$baseName.jpg")
        if (dest.exists()) return dest.absolutePath
        return try {
            val bitmap = android.graphics.BitmapFactory.decodeByteArray(artworkBytes, 0, artworkBytes.size)
            if (bitmap != null) {
                dest.outputStream().use { out ->
                    bitmap.compress(android.graphics.Bitmap.CompressFormat.JPEG, 85, out)
                }
                bitmap.recycle()
                dest.absolutePath
            } else {
                null
            }
        } catch (_: Exception) {
            null
        }
    }

    private fun hueForAlbum(album: String): Int {
        val md5 = MessageDigest.getInstance("MD5").digest(album.toByteArray())
        return ((md5[0].toInt() and 0xFF) or ((md5[1].toInt() and 0xFF) shl 8)) % 360
    }

    private fun rebuildFolderList(prefs: android.content.SharedPreferences) {
        val ids = (prefs.getStringSet("folder_ids", emptySet()) ?: emptySet()).toMutableSet()
        val toRemove = ids.filter { prefs.getString("folder_uri_$it", null) == null }
        ids.removeAll(toRemove.toSet())
        prefs.edit().putStringSet("folder_ids", ids).apply()
    }

    companion object {
        const val NAME = "MusixScannerModule"
        private const val REQUEST_IMPORT = 9001
        private const val REQUEST_FOLDER = 9002
        private const val PREFS_NAME = "musix_watched_folders"
    }
}
