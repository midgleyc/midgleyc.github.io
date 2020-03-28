---
layout: post
title:  "Testing an Angular AsyncValidatorFn using Jasmine"
tags: [technical, javascript, angular, jasmine, webdev]
---

The [Angular documentation on validation](https://angular.io/guide/form-validation#async-validation) mentions that there exists an AsyncValidatorFn counterpart to ValidatorFn, but doesn't give any details in implementing it other than the function prototype. You can guess that it's similar to ValidatorFn in the same way that AsyncValidator is similar to Validator, and this turns out to be correct as far as I can see.

**I.**

By comparisons to ValidatorFn, we expect we want a static function that takes the services we expect to use, and returns an AsyncValidatorFn. By the interface documentation on AsyncValidatorFn, we want to return a function that takes an AbstractControl and return a Promise or Observable that emits either ValidationErrors or null.

{% highlight typescript %}
export class IdValidator {

    static idBlankOrNonDuplicate(idService: IdService): AsyncValidatorFn {
        return (control: AbstractControl): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> => {
        };
    }
}
{% endhighlight %}

We can restrict the types as we like: if we know that our function will return an Observable we can say that, or if it accepts a specific type of control (e.g. FormControl, FormGroup) we can mention that explicitly as well. This information won't be used externally as it's not in the types provided by AsyncValidatorFn, but can be useful inside the function and to readers.

We can bind this async validator to a form using AbstractControlOptions.

{% highlight typescript %}
this.formBuilder.group({
    id: ['', {
        asyncValidators: IdValidator.idBlankOrNonDuplicate(idService)
    } as AbstractControlOptions],
});
{% endhighlight %}

From the AbstractControlOptions interface, we can also add synchronous validators under "validators" and set "updateOn" to 'change', 'blur' or 'submit' to run the validator whenever the user enters anything in the form (typing or pasting), when the user clicks out of the input, or when the user submits the form. The default is 'change'.

**II.**

Having set up the prototype, we can now write the tests:
{% highlight typescript %}
describe('Check IdValidator', () => {

    let serviceSpy: jasmine.SpyObj<IdService>;
    let idValidator: AsyncValidatorFn;

    beforeEach(() => {
        serviceSpy = jasmine.createSpyObj('IdService', ['isIdPresent']);
        idValidator = IdValidator.idBlankOrNonDuplicate(serviceSpy);
    });

    it('should not raise validation error when ID is not duplicated', (done) => {
        serviceSpy.isIdPresent.and.returnValue(asyncData(false));
        const result = idValidator(new FormControl('1')) as Observable<ValidationErrors | null>;
        result.subscribe((res) => {
            expect(res).toBeNull();
            done();
        });
    });

    it('should not raise validation error when ID is duplicated but blank', (done) => {
        serviceSpy.isIdPresent.and.returnValue(asyncData(true));
        const result = idValidator(new FormControl('')) as Observable<ValidationErrors | null>;
        result.subscribe((res) => {
            expect(res).toBeNull();
            done();
        });
    });

    it('should raise validation error when ID is duplicated', (done) => {
        serviceSpy.isIdPresent.and.returnValue(asyncData(true));
        const result = idValidator(new FormControl('1')) as Observable<ValidationErrors | null>;
        result.subscribe((res) => {
            expect(res).toEqual({duplicate: true});
            done();
        });
    });
});
{% endhighlight %}

A strict following of TDD would have you write these one at a time as the functionality was slowly applied. I think for a case like this, where you know all the tests you have to write by the name of the function, it's fine to write them all at once. You can't rely solely on "red/green" for "have I broken any functionality", but looking at the test run output will tell you that anyway, and you always know that you can't declare the feature as "done" until all the tests pass.  If you naively went for the first two tests first, "return of(null)" would satisfy, and then you'd be writing the entire function for the last test anyway.

Now that we have tests to prove the functionality, we can implement the method itself.

{% highlight typescript %}
export class IdValidator {

    static idBlankOrNonDuplicate(idService: IdService): AsyncValidatorFn {
        return (control: AbstractControl): Observable<ValidationErrors | null> => {
            if (control.value === '') {
                return of(null);
            }
            return idService.isIdPresent(control.value).pipe(map((present) => present ? { duplicate: true } : null));
        };
    }
}
{% endhighlight %}

**III.**

Because we've set the validator to update on change, the service will be called every time the user types a key, even if they're still in the middle of typing their ID. This could lead to unwanted network or database requests. We don't have to worry about validating invalid IDs as long as they were validated synchronously:

> It is important to note that the asynchronous validation happens after the synchronous validation, and is performed only if the synchronous validation is successful. This check allows forms to avoid potentially expensive async validation processes such as an HTTP request if more basic validation methods fail.

If we want to avoid hitting the service on an asynchronous failure, we can write
{% highlight typescript %}
if (control.value === '' || control.errors) {
    return of(null);
}
{% endhighlight %}
although I'm not sure if this is required.

In order to avoid calling the service as much, we can add debounce time to the validator so that calls while the user is still typing are ignored. There is a [stackoverflower post](https://stackoverflow.com/questions/36919011/how-to-add-debounce-time-to-an-async-validator-in-angular-2) with many solutions across the years using a variety of library versions -- using the latest version of rxjs, I think using `timer` looks the simplest.

Our final implementation is

{% highlight typescript %}
export class IdValidator {

    DEBOUNCE_TIME = 300;

    static idBlankOrNonDuplicate(idService: IdService): AsyncValidatorFn {
        return (control: AbstractControl): Observable<ValidationErrors | null> => {
            if (control.value === '' || control.errors) {
                return of(null);
            }
            return timer(IdValidator.DEBOUNCE_TIME).pipe(
                switchMap(() => idService.isIdPresent(control.value).pipe(map((present) => present ? { duplicate: true } : null))),
            );
        };
    }
}
{% endhighlight %}

And our test for that piece of functionality:
{% highlight typescript %}
it('should not call service until debounce time has passed', fakeAsync(() => {
    serviceSpy.isIdPresent.and.returnValue(asyncData(false));
    IdValidator.DEBOUNCE_TIME = 1000;
    const result = idValidator(new FormControl('1')) as Observable<ValidationErrors | null>;
    result.subscribe((_) => {});
    tick(100);
    expect(serviceSpy.isIdPresent).not.toHaveBeenCalled();
    tick(1000);
    expect(serviceSpy.isIdPresent).toHaveBeenCalled();
}));
{% endhighlight %}

If you get an error like:

> Error: 1 periodic timer(s) still in the queue.

you can run the `discardPeriodicTasks` method to clear the queue. However, this is likely to indicate a problem with your tests -- try breaking the functionality and confirming that the test fails before clearing the queue forcefully! If you confirm that the test fails when the functionality is broken and passes when the functionality works and `discardPeriodicTasks` is called, go ahead and do that.
