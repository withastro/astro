> **Note:** Our governance model is extremely new, and is not yet binding. Once merged into the `main` branch, we will go into a trial period where we will follow this governance model but may make changes based on feedback. All changes will go through our existing PR review process. After a period of 1-2 months, this note will be removed and this governance model will become binding.

# Governance

This document outlines the governance model for Astro. This includes the contributor model, code review, merging, and the consequences and process for Code of Conduct violations.

**All members must follow the [Code of Conduct](CODE_OF_CONDUCT.md).** Consequences for member violations are detailed in [Moderation](#moderation).

## Get Involved

Anyone can become an Astro Contributor regardless of skill level, experience, or background. All types of contribution are meaningful. Our membership system was designed to reflect this.

**Anything that supports the Astro community is a contribution to the project.** This includes but is not limited to:

- Submitting (and Merging) a Pull Request
- Filing a Bug Report or Feature Request
- Updating Documentation
- Answering questions about Astro on GitHub or Discord
- Answering questions on Stack Overflow, Twitter, etc.
- Blogging, Podcasting, or Livestreaming about Astro

## Membership Levels, Roles and Responsibilities

A list of all active members is available on our project README.

### Contributor L1

Have you done something to contribute to the health, success, or growth of Astro? Congratulations, you're officially a contributor!

**Benefits:**

- Contributor status on the [Astro Discord server](https://astro.build/chat)
- Ability to [vote](GOVERNANCE.md#voting) on some project decisions

**Nomination:**

- Self-nominate by running `!contribute` in our Discord and briefly describe your qualifying contribution (link preferred).
- Connect your Discord account with GitHub (or Reddit, Twitter, etc.) to automatically get recognized for future contributions.

### Contributor L2 (Committer)

**Contributor L2** membership is reserved for users that have shown a commitment to the continued development of the project through ongoing engagement with the community. At this level, contributors are given push access to the project's GitHub repos and must continue to abide by the project's Contribution Guidelines.

Anyone who has made several significant (non-trivial) contributions to Astro can become a Contributor in recognition of their work. An example of a "significant contribution" might be:

- ✅ Triaging and supporting non-trivial Discord and GitHub issues
- ✅ Submitting and reviewing non-trivial PRs
- ✅ Submitting and reviewing non-trivial documentation edits (multiple sections/pages)
- ❌ A typo fix, or small documentation edits of only a few sentences

**Responsibilities:**

- May request write access to relevant Astro projects.
- GitHub: May work on public branches of the source repository and submit pull requests from that branch to the main branch.
- GitHub: Must submit pull requests for all changes, and have their work reviewed by other members before acceptance into the repository.
- GitHub: May merge some pull requests (see Managing Pull Requests)

**Nomination:**

- A nominee will need to show a willingness and ability to participate in the project as a team player.
- Typically, a nominee will need to show that they have an understanding of and alignment with the project, its objectives, and its strategy.
- Nominees are expected to be respectful of every community member and to work collaboratively in the spirit of inclusion.
- Have submitted a minimum of 10 qualifying significant contributions (see list above).
- You can be nominated by any existing Contributor (L2 or above).
- Once nominated, there will be a vote by existing Contributors (L3 or above) (see [voting rules](#voting)).

It is important to recognize that this role is a privilege, not a right. That privilege must be earned and once earned it can be removed (in a vote by project Stewards). However, under normal circumstances this role exists for as long as the Contributor wishes to continue engaging with the project.

Inactive Contributors will have voting rights removed after a certain period of time, however they will always retain their status. Inactivity requirements will be specified in a later governance change.

### Contributor L3 (Core Contributor)

Contributor L3 (Core Contributors) are community members who have contributed a significant amount of time to the project through triaging of issues, fixing bugs, implementing enhancements/features, and are trusted community leaders.

**Responsibilities:**

- May merge external pull requests for accepted issues upon reviewing and approving the changes.
- May merge their own pull requests once they have collected the feedback and approvals they deem necessary.
  - Caveat: No pull request should be merged without at least one Contributor (L2 or above) comment stating they've looked at the code.

**Nomination:**

- Work in a helpful and collaborative way with the community.
- Have given good feedback on others' submissions and displayed an overall understanding of the code quality standards for the project.
- Commit to being a part of the community for the long-term.
- Have submitted a minimum of 50 qualifying significant contributions (see list above).

A Contributor is invited to become a Core Contributor by existing Core Contributors. A nomination will result in discussion and then a decision by the project steward(s).

### Steward

Steward is an additional privilege bestowed to 1 (or more) Contributors. The role of Steward is mainly an administrative one. Stewards control and maintain sensitive project assets, and act as tiebreakers in the event of disagreements. These additional privileges include:

- Access to the [@astrodotbuild Twitter account](https://twitter.com/astrodotbuild)
- Administration privileges on the [astro GitHub org](https://github.com/snowpackjs)
- Administration privileges on the [astro Discord server](https://astro.build/chat)
- Publish access to the [`astro` npm package](https://www.npmjs.com/package/astro)
- Domain registrar and DNS access to `astro.build` and all other domains
- Administration access to the `astro.build` Vercel account
- Ability to initiate a [vote](GOVERNANCE.md#voting)
- Ability to veto [votes](GOVERNANCE.md#voting) and resolve voting deadlocks
- Define project direction and planning
- Ability to decide on moderation decisions
- Access to the `*@astro.build` email address

**Nomination:**

- Stewards cannot be self-nominated.
- Only Core Contributors are eligible.
- New stewards will be added based on a unanimous vote by the existing stewards.
- In the event that someone is unreachable then the decision will be deferred. Discussion and approval will be done in private.

## Voting

Certain project decisions require a vote. These include:

- Governance changes: simple majority (over 50%) conducted via GitHub PR approval.
- Contributor membership (L2 and L3): discussion conducted via a temporary Discord channel open to qualified contributors for up to 3 days. Acceptance requires an overwhelming majority (over 70%) vote conducted by privately messaging a steward. Funneling both assenting and dissenting votes directly through stewards allows for anonymity when discussing the merits of a potential contributor.

A steward may initiate a vote for any unlisted project decision. Core contributors can request a vote by contacting a steward.

### Rules

- Members may abstain from a vote.
- Members who do not vote within 3 days will automatically abstain.
- Stewards may reduce the 3 day automatic abstain for urgent decisions.
- Stewards reserve the right to veto approval with a publicly disclosed reason.

## Moderation

Outlined below is the process for Code of Conduct violation reviews.

### Reporting

Anyone may report a violation. Violations can be reported in the following ways:

- In private, via email to one or more stewards.
- In private, via direct message to a project steward on Discord.
- In public, via a GitHub comment (mentioning `@snowpackjs/maintainers`).
- In public, via the project Discord server (mentioning `staff`).

### Who gets involved?

Each report will be assigned reviewers. These will initially be all project [stewards](#stewards).

In the event of any conflict of interest - ie. stewards who are personally connected to a situation, they must immediately recuse themselves.

At request of the reporter and if deemed appropriate by the reviewers, another neutral third-party may be involved in the review and decision process.

### Review

If a report doesn’t contain enough information, the reviewers will strive to obtain all relevant data before acting.

The reviewers will then review the incident and determine, to the best of their ability:

- What happened.
- Whether this event constitutes a Code of Conduct violation.
- Who, if anyone, was involved in the violation.
- Whether this is an ongoing situation.

The reviewers should aim to have a resolution agreed very rapidly; if not agreed within a week, they will inform the parties of the planned date.

### Resolution

Responses will be determined by the reviewers on the basis of the information gathered and of the potential consequences. It may include:

- taking no further action
- issuing a reprimand (private or public)
- asking for an apology (private or public)
- permanent ban from the GitHub org and Discord server
- revoked contributor status

---

Inspired by [ESLint](https://eslint.org/docs/6.0.0/maintainer-guide/governance) and [Rome](https://github.com/rome/tools/blob/main/GOVERNANCE.md).
