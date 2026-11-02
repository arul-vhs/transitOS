# Disruption Impact Analysis

The Impact Analysis module maps direct and downstream disruption effects.

## Impact Classifications

- **`DIRECT`**: Directly affected by the incident (e.g. assigned to broken-down bus B004).
- **`DOWNSTREAM`**: Chronologically affected by direct failures (e.g. trip B is delayed because trip A arrived late, causing turnaround violation).
- **`SECONDARY`**: Side-effects on crew rest buffers (e.g. crew rest period overlap).

## Downstream Delay Propagation

Delay minutes are propagated chronologically along the duty sequence. If trip $T_i$ is delayed, its new arrival time is:
$$\text{EndTime}'(T_i) = \text{EndTime}(T_i) + \text{Delay}$$

For the subsequent trip $T_{i+1}$, the new gap is:
$$\text{Gap}' = \text{StartTime}(T_{i+1}) - \text{EndTime}'(T_i)$$

If $\text{Gap}' < \text{MIN\_TURNAROUND\_MINUTES}$, a turnaround conflict is triggered. If $\text{Gap}' < 0$, delay is propagated to $T_{i+1}$:
$$\text{Delay}_{i+1} = |\text{Gap}'|$$
This is recursively repeated for all downstream trips in the duty.
