# GraftMap private iPad development

This branch validates the private GraftMap iPad client incrementally.

## Frozen baseline
- v0.9.4 remains the known-good physical-iPad baseline and must not be overwritten.
- New functionality is introduced in small, independently testable increments.

## Current increment
- v0.9.7 Safe Planning: patient/case selection, CMA/PMA inputs, HMI, temple score, target densities, donor regions, donor capacity, PRECISE reference and persistent local JSON planning state.

## Validation policy
- Linux/static checks and deterministic formula tests may run independently of Apple CI.
- Apple/macOS CI is an additional gate, not a development blocker.
- Physical iPad testing is requested only at hardware-dependent checkpoints (camera, SceneKit/ARKit, Swift Playgrounds runtime).

## Clinical status
Planning calculations are prototype decision-support. Functional similarity is not clinical equivalence; metric reconstruction, density estimation and repeatability require validation before clinical reliance.
