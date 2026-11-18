package vn.codematch.matching;

import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class MatchController {
    private final MatchService service;

    public MatchController(MatchService service) { this.service = service; }

    @PostMapping("/me/learning-requests/{requestId}/match")
    public MatchResponse select(@AuthenticationPrincipal UserDetails user, @PathVariable UUID requestId,
                                @Valid @RequestBody SelectProposalRequest command) {
        return service.select(user.getUsername(), requestId, command.proposalId());
    }

    @GetMapping("/me/learning-requests/{requestId}/match")
    public MatchResponse learnerMatch(@AuthenticationPrincipal UserDetails user, @PathVariable UUID requestId) {
        return service.learnerMatch(user.getUsername(), requestId);
    }

    @GetMapping("/me/matches")
    public List<MatchResponse> developerMatches(@AuthenticationPrincipal UserDetails user) {
        return service.developerMatches(user.getUsername());
    }

    @GetMapping("/me/matches/{matchId}")
    public MatchResponse developerMatch(@AuthenticationPrincipal UserDetails user, @PathVariable UUID matchId) {
        return service.developerMatch(user.getUsername(), matchId);
    }

    @GetMapping("/proposals/{proposalId}/selection-status")
    public ProposalSelectionResponse proposalStatus(@AuthenticationPrincipal UserDetails user,
                                                     @PathVariable UUID proposalId) {
        return service.proposalStatus(user.getUsername(), proposalId);
    }
}
