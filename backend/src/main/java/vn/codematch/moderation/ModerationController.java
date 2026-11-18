package vn.codematch.moderation;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import vn.codematch.identity.AccountPrincipal;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class ModerationController {
    private final ModerationService service;
    public ModerationController(ModerationService service) { this.service = service; }

    @PostMapping("/reports")
    @ResponseStatus(HttpStatus.CREATED)
    public ModerationReportResponse create(@AuthenticationPrincipal UserDetails user, @Valid @RequestBody CreateReportRequest request) {
        return service.create(user.getUsername(), request);
    }

    @GetMapping("/me/reports")
    public List<ModerationReportResponse> mine(@AuthenticationPrincipal UserDetails user) { return service.mine(user.getUsername()); }

    @GetMapping("/admin/reports")
    public List<ModerationReportResponse> queue(@RequestParam(required = false) ReportStatus status) { return service.queue(status); }

    @GetMapping("/admin/reports/{id}")
    public ModerationReportResponse detail(@PathVariable UUID id) { return service.report(id); }

    @PostMapping("/admin/reports/{id}/review")
    public ModerationReportResponse review(@AuthenticationPrincipal AccountPrincipal admin, @PathVariable UUID id,
            @RequestBody ReviewReportRequest request) { return service.review(admin.id(), id, request.status()); }

    @PostMapping("/admin/learning-requests/{id}/hide")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void hide(@AuthenticationPrincipal AccountPrincipal admin, @PathVariable UUID id) { service.hideRequest(admin.id(), id, true); }

    @PostMapping("/admin/learning-requests/{id}/restore")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void restore(@AuthenticationPrincipal AccountPrincipal admin, @PathVariable UUID id) { service.hideRequest(admin.id(), id, false); }

    @PostMapping("/admin/users/{id}/suspend")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void suspend(@AuthenticationPrincipal AccountPrincipal admin, @PathVariable UUID id) { service.suspendAccount(admin.id(), id); }

    public record ReviewReportRequest(ReportStatus status) {}
}
