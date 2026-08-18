# Objective: monitor germany3 until the S2 spike report exists on the remote (checks-only waiter)

goal: SPIKE_S2_REPORT.md exists on tracematrix /root/fg-p5 (spike deliverable landed)

acceptance: remote file design/flutter-app-builder/research/SPIKE_S2_REPORT.md exists; then orchestrator transfers + reviews it

check_cmd: ssh -o ConnectTimeout=8 -o BatchMode=yes root@tracematrix.businessanalystcrew.org "test -f /root/fg-p5/design/flutter-app-builder/research/SPIKE_S2_REPORT.md"

artifacts: design/flutter-app-builder/research/SPIKE_S2_REPORT.md (to be scp'd, reviewed, committed)

lane: 

from: 

until_commit: 

level: L0

max_rounds: 40

timeout_mins: 1

prompt: