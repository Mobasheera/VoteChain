// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title VoteChain
/// @notice A small educational voting contract for a local development blockchain.
contract VoteChain {
    address public immutable owner;
    string public electionTitle;
    bool public votingOpen;
    bool public electionFinalized;

    struct Candidate {
        uint256 id;
        string name;
        string description;
        uint256 voteCount;
        bool active;
    }

    Candidate[] private candidates;
    mapping(address => bool) public hasVoted;
    mapping(address => uint256) public votedFor;
    mapping(address => bool) public eligibleVoter;
    address[] private eligibleVoters;

    event CandidateAdded(uint256 indexed candidateId, string name);
    event VoterEligibilityChanged(address indexed voter, bool eligible);
    event VoteCast(address indexed voter, uint256 indexed candidateId);
    event VotingStatusChanged(bool isOpen);
    event ElectionFinalized();

    modifier onlyOwner() {
        require(msg.sender == owner, "Only election admin");
        _;
    }

    constructor(string memory _title) {
        require(bytes(_title).length > 0, "Title is required");
        owner = msg.sender;
        electionTitle = _title;
    }

    function addCandidate(string calldata name, string calldata description) external onlyOwner {
        require(!votingOpen && !electionFinalized, "Election already started");
        require(bytes(name).length > 0, "Candidate name required");
        uint256 id = candidates.length;
        candidates.push(Candidate(id, name, description, 0, true));
        emit CandidateAdded(id, name);
    }

    function setVoterEligibility(address voter, bool eligible) external onlyOwner {
        require(!votingOpen && !electionFinalized, "Eligibility is locked after start");
        require(voter != address(0), "Invalid voter address");
        if (eligible && !eligibleVoter[voter]) eligibleVoters.push(voter);
        eligibleVoter[voter] = eligible;
        emit VoterEligibilityChanged(voter, eligible);
    }

    function startVoting() external onlyOwner {
        require(!votingOpen && !electionFinalized, "Cannot start voting");
        require(candidates.length >= 2, "Add at least two candidates");
        votingOpen = true;
        emit VotingStatusChanged(true);
    }

    function castVote(uint256 candidateId) external {
        require(votingOpen, "Voting is not open");
        require(!hasVoted[msg.sender], "This account has already voted");
        require(eligibleVoter[msg.sender], "This account is not an eligible voter");
        require(candidateId < candidates.length, "Invalid candidate");
        hasVoted[msg.sender] = true;
        votedFor[msg.sender] = candidateId;
        candidates[candidateId].voteCount += 1;
        emit VoteCast(msg.sender, candidateId);
    }

    function endVoting() external onlyOwner {
        require(votingOpen, "Voting is not open");
        votingOpen = false;
        electionFinalized = true;
        emit VotingStatusChanged(false);
        emit ElectionFinalized();
    }

    function getCandidateCount() external view returns (uint256) {
        return candidates.length;
    }

    function getCandidate(uint256 id) external view returns (
        uint256 candidateId, string memory name, string memory description, uint256 voteCount, bool active
    ) {
        require(id < candidates.length, "Invalid candidate");
        Candidate storage c = candidates[id];
        return (c.id, c.name, c.description, c.voteCount, c.active);
    }

    function getEligibleVoters() external view returns (address[] memory) {
        return eligibleVoters;
    }
}
