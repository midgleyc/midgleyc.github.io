---
layout: post
title:  "Using RxJS's switchMap to display a loading spinner after a delay"
tags: [technical, javascript, rxjs, reactive]
---

The problem is to display a loading spinner while requests are in-flight. The complexity is that everything's event-driven, so the components themselves don't know when this happens. A solution to this complexity is to use [RxJs](https://rxjs.dev/guide/overview) or some other event management system.

Initial requirement: display a spinner
======================================

Our initial requirement is to display the "loading" spinner when is request is sent, and remove it when the response is received. We've abstracted this into an `Observable` we can subscribe to: it receives `true` when a request is sent and `false` when a response is received. No additional requests can be sent while the "loading" spinner is present, so this is acceptable -- if we could send multiple requests, we'd have to use a counter to store how many requests were in-flight (increment when sent, decrement when received) and also to consider what we'd do about requests that never returned. For now, this falls under YAGNI.

```typescript
it('should show spinner', () => {
	expect(component.showSpinner).toEqual(false, 'expect spinner to be absent at first');
	sendShowMessage();
	expect(component.showSpinner).toEqual(true, 'expect spinner to be present after show message');
	sendHideMessage();
	expect(component.showSpinner).toEqual(false, 'expect spinner to be absent after hide message');
});
```

This is an Angular test written in Jasmine, but hopefully the logic is clear. The messages are left as functions because how the component receives them isn't important and could change: whether you're dispatching to an NGRX store and subscribing to a selector or injecting, posting and subscribing to a service with a subject, the abstraction means that it can be changed in only one place.

```typescript
showSpinner = false;
unsubscribe$ = new Subject();

ngOnInit(): void {
	observable.pipe(
		takeUntil(this.unsubscribe$)
	).subscribe(showSpinner => this.showSpinner = showSpinner);
}

ngOnDestroy(): void {
	this.unsubscribe$.next()
	this.unsubscribe$.complete()
}
```

This simple implementation just sets a field when the events come in. It also handles clearing up the subscription when the component is destroyed.

A New Requirement: the spinner shows up too much
================================================

User acceptance testing indicates the spinner is too flashy -- it appears on every call, even the ones that barely take any time. A call is made to wait half a second before displaying the spinner, but still to take it down after the call succeeds.

This modifies the original assumption that only one call could happen at a time because this assumption was dependent upon the spinner being shown -- a second decision is made to prevent interaction for half a second, but not display anything graphically, in order to simplify development.

We can use Angular's `fakeAsync` and `tick` to write a test involving time.

```typescript
it('should show spinner after 0.5 seconds', fakeAsync(() => {
	expect(component.showSpinner).toEqual(false, 'expect spinner to be absent at first');
	sendShowMessage();
	tick(400);
	expect(component.showSpinner).toEqual(false, 'expect spinner to be absent while not too much time has passed');
	tick(100);
	expect(component.showSpinner).toEqual(true, 'expect spinner to be present after show message and half a second');
	sendHideMessage();
	expect(component.showSpinner).toEqual(false, 'expect spinner to be absent after hide message');
}));

it('should not show spinner after hide message', fakeAsync(() => {
	expect(component.showSpinner).toEqual(false, 'expect spinner to be absent at first');
	sendShowMessage();
	tick(400);
	sendHideMessage();
	tick(100);
	expect(component.showSpinner).toEqual(false, 'expect spinner to be absent after hide message');
}));
```

We know that we want to delay an observation, so [delay](https://rxjs.dev/api/operators/delay) should be useful. We know that we want to cancel preceding loading calls if we know that a call succeeded, so [switchMap](https://www.learnrxjs.io/learn-rxjs/operators/transformation/switchmap) looks good.

#### A Useful Visualisation: RxViz

While developing, it can be useful to use a visualisation tool such as [RxViz](https://rxviz.com) so you can see the effects of your mapping functions on a pipeline, in addition to checking whether your tests pass or not.

#### The Solution

```typescript
TIME_UNTIL_SHOW = 500

ngOnInit(): void {
	observable.pipe(
		takeUntil(this.unsubscribe$)
		switchMap(show => show ? of(true).pipe(delay(TIME_UNTIL_SHOW)) : of(false))
	).subscribe(showSpinner => this.showSpinner = showSpinner);
}
```

We store the time in a variable to avoid magic numbers and make it easier to change in the future. We could have used `of(show)` instead of `of(true)` and `of(false)`: this would have made the relation clearer, but in my view harder to read.

We could also use [`delayWhen`](https://rxjs.dev/api/operators/delayWhen) to more clearly indicate that the original observation is unchanged, only delayed

```typescript
switchMap(show => of(show).pipe(delayWhen(s => s ? timer(500) : timer(0))))
```

<!-- I think the final intention here was to add another requirement: after 30 seconds, if the spinner hasn't gone away, display an error. -->
