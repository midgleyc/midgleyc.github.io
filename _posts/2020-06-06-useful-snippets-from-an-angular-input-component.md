---
layout: post
title:  "Useful snippets from a reusable Angular Typescript input component"
tags: [technical, typescript, angular]
---

Angular allows creation of reusable components to simplify development. I created an input component in order to simplify how the HTML form pages looked (it allowed a large block of code to be abstracted and replaced; later it allowed all the error texts to be put in one place instead of being repeated for each field).

Initially, I asked the user to provide many pieces of information: id, name, required, max length, and so on that I was later able to derive from the formControlElement and other pieces. This post is to note the techniques I used.

Minimally, I ask that the user provide a FormControlElement (to be updated with the input text) and a label (to display next to the input). It would be nice to have something like `nameof` (as in C#), as the label is often the titlecased property name, but no such luck.

{% highlight typescript %}
@Input()
formControlElement: FormControl;

@Input()
label: string;
{% endhighlight %}

Derive the name and placeholder from the label
----------------------------------------------

In ngOnInit, I set the name and placeholder text from the label, with potential overrides. These are passed into `<input>` as `[name]` and `[placeholder]`.

{% highlight typescript %}
ngOnInit(): void {
	this.inputName = this.nameOverride != null ? this.nameOverride : this.label.toLowerCase();
	this.inputPlaceholder = this.placeholderOverride != null ? this.placeholderOverride : 'Enter ' + this.inputName;
}
{% endhighlight %}

Currently the label is hardcoded text, but if this were dynamic you would need a `ngOnChanges(changes: SimpleChanges): void` method to handle updates of `label`.

Derive the id from the containing form element 
-----------------------------------------------

For test methods, we wanted every component to have a unique id. I initially abstracted this to having the user provide a "idStart" input, to which we then appended the inputName. This is boilerplate, though, and we can do better.

{% highlight typescript %}
el: HTMLElement;

constructor(el: ElementRef) {
	this.el = el.nativeElement;
}

get inputId() {
	return this.closestParentId(this.el) + '-' + this.inputName;
}

private closestParentId(el: HTMLElement) {
	if (el.parentElement == null) {
		return 'form';
	}
	if (el.parentElement.tagName === 'FORM') {
		return el.parentElement.id;
	}
	return this.closestParentId(el.parentElement);
}
{% endhighlight %}

Each form field should be contained inside a form. Assuming the form has an id (if it doesn't, one should be able to be added), a good descriptor for the field is "<formName>-<fieldName>". We can get the HTML element from Angular, walk up the DOM until we get the first form element, then use its ID to generate the field's ID.

Derive whether the field is required
------------------------------------

We add a red * to fields that are required, so the component needs to know whether a field is required so it can attach the appropriate class.

<object type="text/html" data="{{site.url}}/assets/2020-06-input-component/required.html" width="150px" height="40px"></object>

The form control doesn't store any information in itself we could use to check whether a "required" validator is applied, and the `.validator` property gives a conglomeration of all validators applied. We can, however, check whether a validator is applied by seeing if we get an error when we pass in a control that fails validation.

{% highlight typescript %}
get requiredField(): boolean {
	const validator = this.formControlElement.validator && this.formControlElement.validator({} as AbstractControl);
	return validator && validator.required;
}
{% endhighlight %}

{% highlight html %}
<div [ngClass]="{ required: requiredField }">
{% endhighlight %}

Derive whether the field has a maximum length, and what it is
-------------------------------------------------------------

We want to add a warning message as the user gets within 10 characters of hitting the character limit, so that we can let them know that further input won't work. We can do this in a similar way to the `required` check.

{% highlight typescript %}
get maxlength(): number | null {
	const validator = this.formControlElement.validator && this.formControlElement.validator(new FormControl({length: Number.POSITIVE_INFINITY}));
	if (validator && validator.maxlength) {
		return validator.maxlength.requiredLength;
	}
	return null;
}
{% endhighlight %}

{% highlight html %}
<input [attr.maxlength]="maxlength" />
{% endhighlight %}

One note here is that we don't actually need to provide a string to the `FormControl`: we can provide anything with a `length` property, which saves actually computing the string.

Pick between an `<input>` and `<textarea>` tag
----------------------------------------------

Some of our form fields (for example, "notes") use a `<textarea>` tag, because they expect to receive more characters than usual. I knew that most of the logic would be shared between these components, and I didn't want to duplicate it all. Fortunately, we can achieve this by passing in the tag type as a parameter.

{% highlight typescript %}
@Input()
tagType: 'input' | 'textarea' = 'input';
{% endhighlight %}

{% highlight html %}
<ng-container [ngSwitch]="tagType">
	<input *ngSwitchCase="'input'" type="text" [...]>
	<textarea *ngSwitchCase="'textarea'" type="text" [...]></textarea>
</ng-container>
{% endhighlight %}

I had initally duplicated the code, so I set my new component to point at the new style. This creates an unnecessary `<kp-textarea-row>` component around the input row component, but it does make it clearer which fields are textareas or not.

{% highlight typescript %}
@Component({
	selector: 'kp-textarea-row',
	template: `<kp-input-row [tagType]="'textarea'" [formControlElement]="formControlElement" [label]="label"></kp-input-row>`,
})
{% endhighlight %}
