package com.uninode.smartcampus.modules.tickets.service;

import com.uninode.smartcampus.config.SupabaseConfig;
import com.uninode.smartcampus.modules.tickets.exception.InvalidFileTypeException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class SupabaseStorageService {

    private final SupabaseConfig supabaseConfig;

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final String[] ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"};
    private static final String[] ALLOWED_MIME_TYPES = {"image/jpeg", "image/png"};

    /**
     * Upload file to PRIVATE Supabase bucket and return signed URL
     */
    public String uploadFile(MultipartFile file) throws IOException, InvalidFileTypeException {
        validateFile(file);

        String fileName = generateFileName(file.getOriginalFilename());
        String filePath = "tickets/" + fileName;

        try {
            byte[] fileBytes = file.getBytes();
            supabaseConfig.uploadFileToSupabase(filePath, fileBytes, file.getContentType());

            // Generate signed URL valid for configured expiry time (default 1 year)
            String signedUrl = supabaseConfig.createSignedUrl(filePath, supabaseConfig.getSignedUrlExpiry());
            log.info("File uploaded and signed URL generated: {} - URL: {}", fileName, signedUrl);

            return signedUrl;
        } catch (IOException e) {
            log.error("Failed to upload file to Supabase: {}", e.getMessage(), e);
            throw new IOException("Supabase upload failed", e);
        }
    }

    /**
     * Regenerate signed URL for existing file
     */
    public String regenerateSignedUrl(String filePath) throws IOException {
        try {
            String signedUrl = supabaseConfig.createSignedUrl(filePath, supabaseConfig.getSignedUrlExpiry());
            log.info("Signed URL regenerated for: {}", filePath);
            return signedUrl;
        } catch (IOException e) {
            log.error("Failed to regenerate signed URL: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * Delete file from Supabase
     */
    public void deleteFile(String fileName) throws IOException {
        try {
            String filePath = "tickets/" + fileName;
            supabaseConfig.deleteFileFromSupabase(filePath);
            log.info("File deleted from Supabase: {}", fileName);
        } catch (Exception e) {
            log.error("Failed to delete file from Supabase: {}", e.getMessage());
            // Don't throw - deletion failure shouldn't break the app
        }
    }

    /**
     * Validate file type and size
     */
    private void validateFile(MultipartFile file) throws InvalidFileTypeException {
        if (file.isEmpty()) {
            throw new InvalidFileTypeException("File is empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new InvalidFileTypeException("File size exceeds 5MB limit");
        }

        String contentType = file.getContentType();
        boolean isValidMimeType = false;
        for (String allowedType : ALLOWED_MIME_TYPES) {
            if (allowedType.equalsIgnoreCase(contentType)) {
                isValidMimeType = true;
                break;
            }
        }

        if (!isValidMimeType) {
            throw new InvalidFileTypeException("Only PNG and JPEG images are allowed. Got: " + contentType);
        }
    }

    /**
     * Generate unique filename with UUID
     */
    private String generateFileName(String originalFileName) {
        String extension = getFileExtension(originalFileName);
        return UUID.randomUUID() + "." + extension;
    }

    /**
     * Extract file extension from filename
     */
    private String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "bin";
        }
        return fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
    }
}
