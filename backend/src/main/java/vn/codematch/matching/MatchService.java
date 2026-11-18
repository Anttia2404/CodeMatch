package vn.codematch.matching;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.codematch.api.ApiException;
import vn.codematch.audit.AuditEventService;
import vn.codematch.foundation.PilotMetrics;
import vn.codematch.profiles.DeveloperProfile;
import vn.codematch.profiles.DeveloperProfileRepository;
import vn.codematch.proposals.ProposalStatus;
import vn.codematch.proposals.TeachingProposal;
import vn.codematch.proposals.TeachingProposalRepository;
import vn.codematch.requests.LearningRequest;
import vn.codematch.requests.LearningRequestRepository;
import vn.codematch.requests.LearningRequestStatus;

import java.util.List;
import java.util.UUID;

@Service
public class MatchService {
    private final MatchRepository matches;
    private final LearningRequestRepository requests;
    private final TeachingProposalRepository proposals;
    private final DeveloperProfileRepository profiles;
    private final AuditEventService audit;
    private final PilotMetrics metrics;

    public MatchService(MatchRepository matches, LearningRequestRepository requests,
                        TeachingProposalRepository proposals, DeveloperProfileRepository profiles,
                        AuditEventService audit, PilotMetrics metrics) {
        this.matches = matches;
        this.requests = requests;
        this.proposals = proposals;
        this.profiles = profiles;
        this.audit = audit;
        this.metrics = metrics;
    }

    @Transactional
    public MatchResponse select(String email, UUID requestId, UUID proposalId) {
        LearningRequest request = requests.findLockedById(requestId).orElseThrow(ApiException::notFound);
        if (!owns(email, request)) throw ApiException.notFound();

        Match existing = matches.findByLearningRequestId(requestId).orElse(null);
        if (existing != null) {
            if (existing.getSelectedProposal().getId().equals(proposalId)) return MatchResponse.from(existing);
            throw alreadyMatched();
        }
        if (request.getStatus() != LearningRequestStatus.OPEN) {
            throw ApiException.conflict("request_not_open", "Yêu cầu này không còn nhận lựa chọn.");
        }

        TeachingProposal proposal = proposals.findLockedById(proposalId).orElseThrow(ApiException::notFound);
        if (!proposal.getLearningRequest().getId().equals(requestId)) throw ApiException.notFound();
        if (proposal.getStatus() == ProposalStatus.WITHDRAWN) {
            throw ApiException.conflict("proposal_withdrawn", "Không thể chọn đề xuất đã được rút.");
        }
        if (proposal.getStatus() != ProposalStatus.SUBMITTED) {
            throw ApiException.conflict("proposal_not_selectable", "Đề xuất này không thể được chọn.");
        }

        request.markMatched();
        try {
            Match created = matches.saveAndFlush(new Match(UUID.randomUUID(), request, proposal));
            audit.record(request.getLearner().getId(), "MATCH_CONFIRMED", "MATCH", created.getId(), true);
            metrics.record("match.confirmed");
            return MatchResponse.from(created);
        } catch (DataIntegrityViolationException exception) {
            throw alreadyMatched();
        }
    }

    @Transactional(readOnly = true)
    public MatchResponse learnerMatch(String email, UUID requestId) {
        LearningRequest request = requests.findWithSkillsById(requestId).orElseThrow(ApiException::notFound);
        if (!owns(email, request)) throw ApiException.notFound();
        return matches.findWithDetailsByLearningRequestId(requestId).map(MatchResponse::from)
            .orElseThrow(ApiException::notFound);
    }

    @Transactional(readOnly = true)
    public List<MatchResponse> developerMatches(String email) {
        DeveloperProfile profile = profile(email);
        return matches.findAllWithDetailsByDeveloperProfileIdOrderByCreatedAtDesc(profile.getId()).stream()
            .map(MatchResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public MatchResponse developerMatch(String email, UUID matchId) {
        DeveloperProfile profile = profile(email);
        Match match = matches.findById(matchId).orElseThrow(ApiException::notFound);
        if (!match.getDeveloperProfile().getId().equals(profile.getId())) throw ApiException.notFound();
        return matches.findAllWithDetailsByDeveloperProfileIdOrderByCreatedAtDesc(profile.getId()).stream()
            .filter(item -> item.getId().equals(matchId)).findFirst().map(MatchResponse::from)
            .orElseThrow(ApiException::notFound);
    }

    @Transactional(readOnly = true)
    public ProposalSelectionResponse proposalStatus(String email, UUID proposalId) {
        TeachingProposal proposal = proposals.findWithDetailsById(proposalId).orElseThrow(ApiException::notFound);
        boolean proposalOwner = proposal.getDeveloperProfile().getOwner().getEmail().equalsIgnoreCase(email);
        boolean learnerOwner = owns(email, proposal.getLearningRequest());
        if (!proposalOwner && !learnerOwner) throw ApiException.notFound();

        Match match = matches.findByLearningRequestId(proposal.getLearningRequest().getId()).orElse(null);
        ProposalSelectionStatus selectionStatus;
        if (proposal.getStatus() == ProposalStatus.WITHDRAWN) selectionStatus = ProposalSelectionStatus.WITHDRAWN;
        else if (match == null) selectionStatus = ProposalSelectionStatus.PENDING;
        else selectionStatus = match.getSelectedProposal().getId().equals(proposalId)
            ? ProposalSelectionStatus.SELECTED : ProposalSelectionStatus.NOT_SELECTED;
        return new ProposalSelectionResponse(proposal.getLearningRequest().getId(),
            proposal.getLearningRequest().getStatus(), proposal.getStatus(), selectionStatus);
    }

    private boolean owns(String email, LearningRequest request) {
        return email != null && request.getLearner().getEmail().equalsIgnoreCase(email);
    }

    private DeveloperProfile profile(String email) {
        return profiles.findWithOwnerAndSkillsByOwnerEmailIgnoreCase(email).orElseThrow(ApiException::notFound);
    }

    private ApiException alreadyMatched() {
        return ApiException.conflict("request_already_matched", "Yêu cầu này đã có developer được chọn.");
    }
}
