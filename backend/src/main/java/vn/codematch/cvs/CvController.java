package vn.codematch.cvs;

import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/developer/cvs")
public class CvController {
    private final CvService service;

    public CvController(CvService service) { this.service = service; }

    @GetMapping
    public List<DeveloperCvResponse> list(@AuthenticationPrincipal UserDetails user) {
        return service.list(user.getUsername());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public DeveloperCvResponse upload(@AuthenticationPrincipal UserDetails user, @RequestPart("file") MultipartFile file) {
        return service.upload(user.getUsername(), file);
    }

    @PutMapping(path = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public DeveloperCvResponse replace(@AuthenticationPrincipal UserDetails user, @PathVariable UUID id,
                                       @RequestPart("file") MultipartFile file) {
        return service.replace(user.getUsername(), id, file);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserDetails user, @PathVariable UUID id) {
        service.delete(user.getUsername(), id);
    }

    @GetMapping("/{id}/file")
    public ResponseEntity<byte[]> download(@AuthenticationPrincipal UserDetails user, @PathVariable UUID id) {
        return asDownload(service.downloadOwned(user.getUsername(), id));
    }

    public static ResponseEntity<byte[]> asDownload(CvDownload download) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentLength(download.content().length);
        headers.setContentDisposition(ContentDisposition.attachment()
            .filename(download.fileName(), StandardCharsets.UTF_8).build());
        headers.setCacheControl(CacheControl.noStore());
        headers.set("X-Content-Type-Options", "nosniff");
        return new ResponseEntity<>(download.content(), headers, HttpStatus.OK);
    }
}
