/**
 * Animation Registry — global lookup table for concept animations.
 *
 * Every animation module calls `registerAnimation(kpId, factory)` to
 * associate a factory function with one or more knowledge-point IDs.
 * The ConceptAnimation Vue component reads from this registry at
 * mount time to decide which animation to render.
 */

// Global registry for concept animations
window.__conceptAnimations = window.__conceptAnimations || {};

/**
 * Register an animation factory for a given KP ID.
 *
 * @param {number}   kpId    Knowledge-point ID (must match DB primary key).
 * @param {Function} factory (canvas, ctx) => animationObject
 */
function registerAnimation(kpId, factory) {
  window.__conceptAnimations[kpId] = factory;
}

/**
 * Register the same factory for multiple KP IDs at once.
 *
 * @param {number[]} kpIds   Array of knowledge-point IDs.
 * @param {Function} factory (canvas, ctx) => animationObject
 */
function registerAnimationBatch(kpIds, factory) {
  kpIds.forEach(function (kpId) {
    window.__conceptAnimations[kpId] = factory;
  });
}
