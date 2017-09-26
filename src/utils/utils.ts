import * as React from 'react';

export function isStateless(component: React.ComponentType<any>): boolean {
    // `function() {}` has prototype, but `() => {}` doesn't
    // `() => {}` via Babel has prototype too.
    return !(component.prototype && component.prototype.render)
}
