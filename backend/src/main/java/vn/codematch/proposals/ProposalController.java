package vn.codematch.proposals;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import vn.codematch.cvs.CvController;
import vn.codematch.cvs.CvDownload;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class ProposalController {
    private final ProposalService service;

    public ProposalController(ProposalService service) { this.service = service; }

    @PostMapping("/learning-requests/{requestId}/proposals")
    @ResponseStatus(HttpStatus.CREATED)
    public ProposalResponse submit(@AuthenticationPrincipal UserDetails user, @PathVariable UUID requestId,
                                   @Valid @RequestBody ProposalCommand command) {
        return service.submit(user.getUsername(), requestId, command);
    }

    @GetMapping("/me/proposals")
    public List<ProposalResponse> mine(@AuthenticationPrincipal UserDetails user) {
        return service.mine(user.getUsername());
    }

    @GetMapping("/me/learning-requests/{requestId}/proposals")
    public List<ProposalResponse> received(@AuthenticationPrincipal UserDetails user, @PathVariable UUID requestId) {
        return service.received(user.getUsername(), requestId);
    }

    @GetMapping("/proposals/{id}")
    public ProposalResponse get(@AuthenticationPrincipal UserDetails user, @PathVariable UUID id) {
        return service.get(user.getUsername(), id);
    }

    @PatchMapping("/proposals/{id}")
    public ProposalResponse update(@AuthenticationPrincipal UserDetails user, @PathVariable UUID id,
                                   @Valid @RequestBody ProposalCommand command) {
        return service.update(user.getUsername(), id, command);
    }

    @PostMapping("/proposals/{id}/withdraw")
    public ProposalResponse withdraw(@AuthenticationPrincipal UserDetails user, @PathVariable UUID id) {
        return service.withdraw(user.getUsername(), id);
    }

    @GetMapping("/proposals/{id}/cv")
    public ResponseEntity<byte[]> downloadCv(@AuthenticationPrincipal UserDetails user, @PathVariable UUID id) {
        CvDownload download = service.downloadCv(user.getUsername(), id);
        return CvController.asDownload(download);
    }
}
