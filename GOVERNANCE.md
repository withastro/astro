> **Note:** Our governance model is extremely new, and is not yet binding. Once merged into the `main` branch, we will go into a trial period where we will follow this governance model but may make changes based on feedback. All changes will go through our existing PR review process. After a period of 1-2 months, this note will be removed and this governance model will become binding.

# Governance

This document outlines the governance model for Astro. This includes detailed descriptions of the contributor levels, nomination process, code review process, pull request merge process, and the consequences of Code of Conduct violations.

👉 **All community members must follow the [Code of Conduct (CoC)](CODE_OF_CONDUCT.md).**  
Consequences for CoC violations are detailed in [Moderation](#moderation).

👉 **Want to trigger a vote, nomination, or perform some other action?**  
Scroll down to [Playbook](#governance-playbook).

## Get Involved

**Anything that supports the Astro community is a valuable contribution.** All types of contribution are meaningful, from code to documentation to blog posts. Anyone can become an Astro Contributor (yes, even you!). Our goal is to recognize all contributors to Astro regardless of skill, experience or background.

## Contributor Levels

We recognize different degrees of contribution as **levels**, and most levels can be reached regardless of coding skill or years of experience. The two most important things that we look for in contributors are:

- **Being here** - Everyone's time is valuable, and the fact that you're here and contributing to Astro is amazing! Thank you for being a part of this journey with us.
- **Being a positive member of our community** - Go above and beyond our Code of Conduct, and commit to healthy communication in pull requests, issue discussions, Discord conversations, and interactions outside of our community (ex: no Twitter bullies allowed :)

Each level unlocks new privileges and responsibilities on Discord and GitHub. Below is a summary of each contributor level:

### Level 1 - Contributor

Have you done something (big or small) to contribute to the health, success, or growth of Astro? Congratulations, you're officially recognized as a contributor to the project!

#### Examples of recognized contributions

- **GitHub:** Submitting a merged pull request
- **GitHub:** Filing a detailed bug report or RFC
- **GitHub:** Updating documentation!
- Helping people on GitHub, Discord, etc.
- Answering questions on Stack Overflow, Twitter, etc.
- Blogging, Vlogging, Podcasting, and Livestreaming about Astro
- This list is incomplete! Similar contributions are also recognized.

#### Privileges

- New role on [Discord](https://astro.build/chat): `@contributor`
- New name color on Discord: **light blue**.
- Access to exclusive Astro emotes on Discord.
- Invitations to contributor-only events, sticker drops, and the occasional swag drop.

#### Responsibilities

This role does not require any extra responsibilities or time commitment. We hope you stick around and keep participating!

If you're interested in reaching the next level and becoming a Maintainer, you can begin to explore some of those responsibilities in the next section.

#### Nomination Process

_Note: This process is still in progress, and the Discord bot that will power it is not yet built. For now, manually nominate/self-nominate by posting in Discord._

- Self-nominate by running `!contribute` in the `#new-contributors` Discord channel and briefly describe your qualifying contribution (link recommended).
- Connect your Discord account with GitHub (or Reddit, Twitter, etc.) to automatically get recognized for future contributions.

### Level 2 (L2) - Maintainer

The **Maintainer** role is available to any contributor who wants to join the team and take part in the long-term maintenance of Astro.

The Maintainer role is critical to the long-term health of Astro. Maintainers act as the first line of defense when it comes to new issues, pull requests and #support channel activity. Maintainers are most likely the first people that a user will interact with on Discord or GitHub.

**A Maintainer is not required to write code!** Some Maintainers spend most of their time inside of Discord, maintaining a healthy community there. Maintainers can also be thought of as **Moderators** on Discord and carry special privileges for moderation.

There is no strict minimum number of contributions needed to reach this level, as long as you can show **sustained** involvement over some amount of time (at least a couple of weeks).

#### Recognized Contributions

- **GitHub:** Submitting non-trivial pull requests and RFCs
- **GitHub:** Reviewing non-trivial pull requests and RFCs
- **Discord:** Supporting users in Discord, especially in the #support channel
- **Discord:** Active participation in RFC calls and other events
- **GitHub + Discord:** Triaging and confirming user issues
- This list is incomplete! Similar contributions are also recognized.

#### Privileges

- All privileges of the [Contributor role](#level-1---contributor), plus...
- `@maintainer` role on [Discord](https://astro.build/chat)
- New name color on Discord: **blue**.
- Invitation to the private #maintainers channel on Discord.
- Invitation to the `maintainers` team on GitHub.
- Ability to moderate Discord.
- Ability to push branches to the repo (No more personal fork needed).
- Ability to review GitHub PRs.
- Ability to merge _some_ GitHub PRs.
- Ability to vote on _some_ initiatives (see [Voting](#voting) below).

#### Responsibilities

- Participate in the project as a team player.
- Bring a friendly, welcoming voice to the Astro community.
- Be active on Discord, especially in the #support channel.
- Triage new issues.
- Review pull requests.
- Merge some, non-trivial community pull requests.
- Merge your own pull requests (once reviewed and approved).

#### Nomination

To be nominated, a nominee is expected to already be performing some of the responsibilities of a Maintainer over the course of at least a couple of weeks. In the past we have used **10 merged pull requests** as a rough minimum for potential Maintainers, but there is no hard requirement.

In some rare cases, this role may be revoked by a project Steward. However, under normal circumstances this role is granted for as long as the contributor wishes to engage with the project.

#### Nomination Process

- You can be nominated by any existing Maintainer (L2 or above).
- Once nominated, there will be a vote by existing Maintainers (L2 and above).
- See [vote rules & requirements](#voting) for info on how the vote works.

### Level 3 (L3) - Core Maintainer

**Core Maintainers** are community members who have contributed a significant amount of time and energy to the project through issues, bug fixes, implementing enhancements/features, and engagement with the community. A Core Maintainer is considered a trusted leader within the community.

A Core Maintainer has significant sway in software design decisions. For this reason, coding experience is critical for this role. Core Maintainer is the only level of contributor that does require a significant contribution history on GitHub.

Core maintainers are watchdogs over the code, ensuring code quality, correctness and security. A Core Maintainer helps to set the direction of the project and ensure a healthy future for Astro.

Some contributors will not reach this level, and that's okay! L2 Maintainers still have significant responsibility and privileges in our community.

#### Privileges

- All privileges of the [Maintainer role](#level-2---maintainer), plus...
- All of the privileges of L2, including...
- `@core` role on [Discord](https://astro.build/chat)
- New name color on Discord: **deep, dark blue**.
- Invitation to the private #core channel on Discord.
- Invitation to the `core` team on GitHub.
- Ability to merge all GitHub PRs.
- Ability to vote on all initiatives (see [Voting](#voting) below).

#### Responsibilities

- All of the responsibilities of L2, including...
- Ownership over specific parts of the project.
- Maintaining and improving overall architecture.
- Tracking and ensuring progress of open pull requests.
- Reviewing and merging larger, non-trivial PRs.

#### Nomination

To be nominated, a nominee is expected to already be performing some of the responsibilities of a Core Maintainer. This could include showing expertise over some larger section of the codebase, championing RFCs through ideation and implementation, reviewing non-trivial PRs and providing critical feedback, or some combination of those responsibilities listed above.

If a Core Maintainer steps away from the project for a significant amount of time, they may be removed as a Core Maintainer (L3 -> L2) until they choose to return.

In some rare cases, this role may be revoked by a project Steward. However, under normal circumstances this role is granted for as long as the contributor wishes to engage with the project.

#### Nomination Process

- You can be nominated by any existing Core Maintainer (L3 or above).
- Once nominated, there will be a vote by existing Core Maintainers (L3 and above).
- See [vote rules & requirements](#voting) for info on how the vote works.

### Steward

Steward is an additional privilege bestowed to 1 (or more) Core Maintainers. The role of Steward is mainly an administrative one. Stewards control and maintain sensitive project assets, and act as tiebreakers in the event of disagreements.

In extremely rare cases, a Steward can act unilaterally when they believe it is in the project's best interest and can prove that the issue cannot be resolved through normal governance procedure. The steward must publicly state their reason for unilateral action before taking it.

The project Steward is currently: **@FredKSchott**

#### Responsibilities

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

#### Nomination

- Stewards cannot be self-nominated.
- Only Core Maintainers are eligible.
- New stewards will be added based on a unanimous vote by the existing Steward(s).
- In the event that someone is unreachable then the decision will be deferred.

# Governance Playbook

## Voting

Certain project decisions (like governance changes and membership nominations) require a vote. Below are the changes that require a vote, and the rules that govern that vote.

The project Steward may initiate a vote for any unlisted project decision. [General Rules](#general-rules) will apply, along with any addition rules provided at the steward's discretion. If this unlisted project decision is expected to be repeated in the future, voting rules should be agreed on and then added to this document.

### General Voting Rules

- Members may abstain from any vote.
- Members who do not vote within 3 days will automatically abstain.
- Stewards may reduce the 3 day automatic abstain for urgent decisions.
- Stewards reserve the right to veto approval with a publicly disclosed reason.

## Voting: Maintainer (L2) Nomination

This process kicks off once a valid nomination has been made. See ["Maintainer - Nomination Process"](#nomination-process) above for more details on nomination.

**Who can vote:** All Maintainers (L2 and above).

1. A vote thread should be created in Discord #maintainers channel (the private channel for all maintainers).
2. A vote thread can be created by any core maintainer, or the Steward.
3. Once a vote thread is created, existing Core Maintainers can discuss the nomination in private.
4. The normal 3 day voting & discussion window begins with the thread creation.
5. Voting can be done in the thread (visible to other voters) or in a private DM to the project Steward.
6. Once the vote is complete, the thread is deleted.
7. The vote must receive an overwhelming majority (70%+) to pass.
8. **If the vote passes:** the nominee will be made a Core Maintainer and all privileges will be made available to them.
9. **If the vote fails:** the project Steward is responsible for informing the nominee with constructive, actionable feedback. (Note: this is not required if the nomination was made in the #core channel, or if the nominee was otherwise not made aware of their nomination).

#### Draft message to send to accepted maintainer, informing them of the decision:

```
Hey ${NAME}!

**I have some exciting news — you've been given the role of L2 Contributor (aka Maintainer/Moderator) in the Astro community!**

Some background: I nominated you for the role in the (private) #maintainers channel, and the consensus was overwhelmingly positive. Some quotes from the nomination thread that sum up the impact you've already had on the project so far:

- ...
- ...
- ...

Thank you for ${1 SENTENCE DESCRIPTION OF CONTRIBUTIONS}. Your impact has definitely been felt and we would be thrilled to have your help building a healthy future for Astro! There is no required time commitment: you can continue to contribute as often or as little as you'd like. This is mainly a chance to recognize your contributions and give you more privileges in Discord and GitHub.

Please let me know if you’re interested in accepting this invitation. If so, we’ll start getting your roles up to date. And if you have any questions, feel free to let me know.

Best,
${MY_NAME}

*PS: As a reminder, our Governance document describes the following privileges and responsibilities for the  **L2 - Maintainer** role: https://github.com/withastro/astro/blob/main/GOVERNANCE.md*
```

## Voting: Core Maintainer (L3) Nomination

This process kicks off once a valid nomination has been made. See ["Core Maintainer - Nomination Process"](#nomination-process) above for more details on nomination.

**Who can vote:** All Core Maintainers (L3 and above).

1. A vote thread should be created in Discord #core channel (the private channel for core maintainers).
1. A vote thread can be created by any core maintainer, or the Steward.
1. Once a vote thread is created, existing Core Maintainers can discuss the nomination in private.
1. The normal 3 day voting & discussion window begins with the thread creation.
1. Voting can be done in the thread (visible to other voters) or in a private DM to the project Steward.
1. Once the vote is complete, the thread is deleted.
1. The vote must receive an overwhelming majority (70%+) to pass.
1. **If the vote passes:** the nominee will be made a Core Maintainer and all privileges will be made available to them.
1. **If the vote fails:** the project Steward is responsible for informing the nominee with constructive, actionable feedback. (Note: this is not required if the nomination was made in the #core channel, or if the nominee was otherwise not made aware of their nomination).

#### Draft message to send to accepted maintainer, informing them of the decision:

```
Hey $NAME!

I have some exciting news—you’ve been nominated and accepted as a core maintainer of Astro! The core maintainer group held a vote and overwhelmingly agree that you would be a great addition to the team. Congratulations! Thanks for all of your significant contributions to Astro to date and your continued dedication to this project and our community. We would be thrilled to have your help ensuring a healthy future for Astro!

Please let me know if you’re interested in accepting this invitation. If so, we’ll start getting your roles and permissions up to date.

As a reminder, our Governance document describes the following privileges and responsibilities for a **Core Maintainer**:

#### Privileges

$COPY_AND_PASTE_FROM_ABOVE

#### Responsibilities

$COPY_AND_PASTE_FROM_ABOVE
```

## Voting: Governance Change

A vote is initiated once a pull request to the GOVERNANCE.md file is submitted by a Core Maintainer.

If the pull request submitter is not a Core Maintainer, the PR can be closed by any Maintainer without a vote. However, any Core Maintainer may request a vote on that PR, in which case a vote is initiated.

**Who can vote:** Core Maintainers (L3 and above). All Maintainers are encouraged to discuss and voice their opinion in the pull request discussion. Core Maintainers should take the opinions of others into consideration when voting.

1. The pull request discussion thread is used to discuss the governance change.
2. The normal 3 day voting & discussion window begins with either the PR creation or the removal of `WIP:` from the PR title if the PR was created as a draft.
3. Voting can be done in the pull request via a review of either **Approve (For)** or **Change Requested (Against)**.
4. The vote must receive a simple majority (50%+) to pass.
5. **If the vote passes:** the PR is merged and the changes take effect immediately.
6. **If the vote fails:** the PR is closed and no change occurs.

## Voting: RFC Proposals

Astro features are discussed using a model called [Consensus-seeking decision-making](https://en.wikipedia.org/wiki/Consensus-seeking_decision-making). This model attempts to achieve consensus on all significant changes to Astro, but has a fallback voting procedure in place if consensus appears unattainable.

**Who can vote:** All Maintainers (L2 and above).

1. Anyone can submit an RFC to suggest changes to Astro.
2. A trivial change can be discussed and approved entirely within the RFC GitHub issue, as long as there are no objections from Maintainers or Core Maintainers. This is not considered a formal vote.
3. A non-trivial, significant change should be discussed within the RFC GitHub issue and approved during an RFC meeting call.
4. During an RFC meeting, the moderator will attempt to achieve consensus on the RFC proposal.
5. **If consensus is reached:** the RFC is approved.
6. **If consensus is not reached:** Maintainers must make all reasonable attempts to resolve issues and reach consensus in GitHub or a follow-up RFC meeting. The process of reaching consensus can take time, and should not be rushed as long as all participants are making a reasonable effort to respond.
7. **If consensus still cannot be reached:** The project Steward may initiate the first fallback mechanism by limiting the vote to Core Maintainers.
8. **If consensus still cannot be reached:** The project Steward may initiate a final fallback vote of Core Maintainers, of which an overwhelming majority (80%+) is required to pass.
9. **If consensus still cannot be reached:** The RFC is closed without approval.

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

Inspired by [ESLint](https://eslint.org/docs/6.0.0/maintainer-guide/governance), [Rome](https://github.com/rome/tools/blob/main/GOVERNANCE.md) and [Blitz](https://blitzjs.com/docs/maintainers).
