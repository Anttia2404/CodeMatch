package vn.codematch.profiles;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class DeveloperProfileController {
    private final DeveloperProfileService profiles;

    public DeveloperProfileController(DeveloperProfileService profiles) {
        this.profiles = profiles;
    }

    @GetMapping("/skills")
    public List<SkillResponse> skills() {
        return profiles.listSkills();
    }

    @GetMapping("/developers/{profileId}")
    public DeveloperProfileResponse publicProfile(@PathVariable UUID profileId) {
        return profiles.getPublic(profileId);
    }

    @GetMapping("/developers/me")
    public DeveloperProfileResponse myProfile(@AuthenticationPrincipal UserDetails principal) {
        return profiles.getMine(principal.getUsername());
    }

    @PostMapping("/developers/me")
    @ResponseStatus(HttpStatus.CREATED)
    public DeveloperProfileResponse create(@AuthenticationPrincipal UserDetails principal,
                                           @Valid @RequestBody DeveloperProfileCommand command) {
        return profiles.create(principal.getUsername(), command);
    }

    @PutMapping("/developers/me")
    public DeveloperProfileResponse update(@AuthenticationPrincipal UserDetails principal,
                                           @Valid @RequestBody DeveloperProfileCommand command) {
        return profiles.update(principal.getUsername(), command);
    }
}
