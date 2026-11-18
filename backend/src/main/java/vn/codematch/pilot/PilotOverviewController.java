package vn.codematch.pilot;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
public class PilotOverviewController {
    private final PilotOverviewService service;

    public PilotOverviewController(PilotOverviewService service) {
        this.service = service;
    }

    @GetMapping("/pilot-overview")
    public PilotOverviewResponse overview() {
        return service.getOverview();
    }
}
