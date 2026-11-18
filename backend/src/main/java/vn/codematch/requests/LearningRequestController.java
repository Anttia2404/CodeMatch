package vn.codematch.requests;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import vn.codematch.identity.AccountPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class LearningRequestController {
    private final LearningRequestService service;

    public LearningRequestController(LearningRequestService service) { this.service = service; }

    @PostMapping("/learning-requests")
    @ResponseStatus(HttpStatus.CREATED)
    public LearningRequestResponse create(@AuthenticationPrincipal UserDetails user, @Valid @RequestBody LearningRequestCommand command) {
        return service.create(user.getUsername(), command);
    }

    @GetMapping("/learning-requests")
    public PageResponse<LearningRequestResponse> discover(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) List<UUID> skillIds,
            @RequestParam(required = false) LearningLevel level,
            @RequestParam(required = false) LearningFormat format,
            @RequestParam(required = false) Long minBudget,
            @RequestParam(required = false) Long maxBudget,
            @RequestParam(required = false) BudgetUnit budgetUnit,
            @RequestParam(required = false) Boolean requiresCv,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "NEWEST") String sort) {
        return service.discover(q, skillIds, level, format, minBudget, maxBudget, budgetUnit, requiresCv, page, size, sort);
    }

    @GetMapping("/learning-requests/{id}")
    public LearningRequestResponse get(@AuthenticationPrincipal UserDetails user, @PathVariable UUID id) {
        boolean admin = user instanceof AccountPrincipal principal && principal.admin();
        return service.get(user == null ? null : user.getUsername(), id, admin);
    }

    @GetMapping("/me/learning-requests")
    public PageResponse<LearningRequestResponse> mine(@AuthenticationPrincipal UserDetails user,
            @RequestParam(required = false) LearningRequestStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return service.mine(user.getUsername(), status, page, size);
    }

    @PatchMapping("/learning-requests/{id}")
    public LearningRequestResponse update(@AuthenticationPrincipal UserDetails user, @PathVariable UUID id,
            @Valid @RequestBody LearningRequestCommand command) {
        return service.update(user.getUsername(), id, command);
    }

    @PostMapping("/learning-requests/{id}/publish")
    public LearningRequestResponse publish(@AuthenticationPrincipal UserDetails user, @PathVariable UUID id) {
        return service.publish(user.getUsername(), id);
    }

    @PostMapping("/learning-requests/{id}/close")
    public LearningRequestResponse close(@AuthenticationPrincipal UserDetails user, @PathVariable UUID id) {
        return service.close(user.getUsername(), id);
    }

    @GetMapping("/saved-requests")
    public List<LearningRequestResponse> saved(@AuthenticationPrincipal UserDetails user) {
        return service.saved(user.getUsername());
    }

    @PutMapping("/saved-requests/{requestId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void save(@AuthenticationPrincipal UserDetails user, @PathVariable UUID requestId) {
        service.save(user.getUsername(), requestId);
    }

    @DeleteMapping("/saved-requests/{requestId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unsave(@AuthenticationPrincipal UserDetails user, @PathVariable UUID requestId) {
        service.unsave(user.getUsername(), requestId);
    }
}
