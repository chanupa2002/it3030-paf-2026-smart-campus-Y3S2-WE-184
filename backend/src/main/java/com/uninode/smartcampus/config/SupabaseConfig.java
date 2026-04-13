package com.uninode.smartcampus.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Component
@Getter
@RequiredArgsConstructor
@Slf4j
public class SupabaseConfig {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    @Value("${supabase.bucket}")
    private String bucketName;

    @Value("${supabase.signed-url-expiry:31536000}")
    private Long signedUrlExpiry;

    private final ObjectMapper objectMapper;
    private final OkHttpClient httpClient = new OkHttpClient();

    /**
     * Upload file to private Supabase bucket
     */
    public void uploadFileToSupabase(String filePath, byte[] fileBytes, String contentType) throws IOException {
        String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucketName + "/" + filePath;

        RequestBody body = RequestBody.create(fileBytes, MediaType.parse(contentType));

        Request request = new Request.Builder()
                .url(uploadUrl)
                .post(body)
                .addHeader("Authorization", "Bearer " + supabaseKey)
                .addHeader("X-Upsert", "false")
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String errorBody = response.body() != null ? response.body().string() : "Unknown error";
                log.error("Supabase upload failed: {} - {}", response.code(), errorBody);
                throw new IOException("Upload failed: " + response.code());
            }
            log.info("File uploaded to Supabase: {}", filePath);
        }
    }

    /**
     * Create signed URL for private file (expires after specified time in seconds)
     */
    public String createSignedUrl(String filePath, long expirationSeconds) throws IOException {
        String signUrl = supabaseUrl + "/storage/v1/object/sign/" + bucketName + "/" + filePath;

        Map<String, Object> body = new HashMap<>();
        body.put("expiresIn", expirationSeconds);

        RequestBody requestBody = RequestBody.create(
                objectMapper.writeValueAsString(body),
                MediaType.parse("application/json")
        );

        Request request = new Request.Builder()
                .url(signUrl)
                .post(requestBody)
                .addHeader("Authorization", "Bearer " + supabaseKey)
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String errorBody = response.body() != null ? response.body().string() : "Unknown error";
                log.error("Failed to create signed URL: {} - {}", response.code(), errorBody);
                throw new IOException("Failed to create signed URL: " + response.code());
            }

            String responseBody = response.body().string();
            log.debug("Signed URL response: {}", responseBody);
            Map<String, Object> result = objectMapper.readValue(responseBody, Map.class);
            String signedUrl = (String) result.get("signedURL");
            log.info("Signed URL created for: {} - Result: {}", filePath, signedUrl != null ? "SUCCESS" : "NULL");
            if (signedUrl == null) {
                log.error("Signed URL is null! Response was: {}", responseBody);
                throw new IOException("Signed URL generation returned null");
            }
            // If the signed URL is relative, prepend the Supabase URL
            if (signedUrl.startsWith("/")) {
                signedUrl = supabaseUrl + "/storage/v1" + signedUrl;
                log.info("Converted relative URL to absolute: {}", signedUrl);
            }
            return signedUrl;
        }
    }

    /**
     * Delete file from Supabase
     */
    public void deleteFileFromSupabase(String filePath) throws IOException {
        String deleteUrl = supabaseUrl + "/storage/v1/object/" + bucketName + "/" + filePath;

        Request request = new Request.Builder()
                .url(deleteUrl)
                .delete()
                .addHeader("Authorization", "Bearer " + supabaseKey)
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful() && response.code() != 404) {
                String errorBody = response.body() != null ? response.body().string() : "Unknown error";
                log.error("Failed to delete file: {} - {}", response.code(), errorBody);
                throw new IOException("Delete failed: " + response.code());
            }
            log.info("File deleted from Supabase: {}", filePath);
        }
    }

    /**
     * Get public URL prefix for file
     */
    public String getPublicUrlPrefix() {
        return supabaseUrl + "/storage/v1/object/public/" + bucketName;
    }
}
