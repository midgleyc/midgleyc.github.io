---
layout: post
title:  "Using RxJS's switchMap and concat to simplify code and eliminate race conditions"
tags: [technical, javascript, rxjs, reactive]
published: false
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
