package vn.codematch.cvs;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import vn.codematch.api.ApiException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

public final class PdfContentValidator {
    public static final long MAX_SIZE_BYTES = 5L * 1024 * 1024;

    private PdfContentValidator() {}

    public static String validate(byte[] content, String originalName) {
        if (content == null || content.length == 0) throw ApiException.badRequest("Chọn một tệp PDF để tải lên.");
        if (content.length > MAX_SIZE_BYTES) throw ApiException.badRequest("Tệp PDF không được lớn hơn 5 MB.");
        String safeName = safeName(originalName);
        if (!safeName.toLowerCase(java.util.Locale.ROOT).endsWith(".pdf")) {
            throw ApiException.badRequest("Tên tệp cần có phần mở rộng .pdf.");
        }
        byte[] signature = "%PDF-".getBytes(StandardCharsets.US_ASCII);
        if (content.length < signature.length || !Arrays.equals(signature, Arrays.copyOf(content, signature.length))) {
            throw ApiException.badRequest("Tệp tải lên không có cấu trúc PDF hợp lệ.");
        }
        try (PDDocument document = Loader.loadPDF(content)) {
            if (document.isEncrypted() || document.getNumberOfPages() < 1) {
                throw ApiException.badRequest("Tệp PDF cần mở được và có ít nhất một trang.");
            }
        } catch (IOException exception) {
            throw ApiException.badRequest("Tệp tải lên không phải PDF hợp lệ hoặc không thể mở.");
        }
        return safeName;
    }

    static String safeName(String originalName) {
        String candidate = originalName == null ? "cv.pdf" : originalName.replace('\\', '/');
        int lastSeparator = candidate.lastIndexOf('/');
        if (lastSeparator >= 0) candidate = candidate.substring(lastSeparator + 1);
        candidate = candidate.replaceAll("[\\p{Cntrl}]", "").trim();
        if (candidate.isBlank()) candidate = "cv.pdf";
        if (candidate.length() > 180) candidate = candidate.substring(candidate.length() - 180);
        return candidate;
    }
}
