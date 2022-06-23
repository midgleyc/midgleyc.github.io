---
layout: post
title: "Moving from Json.NET (Newtonsoft) to System.Text.Json"
tags: [technical, c#, net, json]
---

In mid-2019, [Microsoft released](https://devblogs.microsoft.com/dotnet/try-the-new-system-text-json-apis/) the `System.Text.Json` library, intended to be a faster and lower memory JSON serializer / deserializer than the existing and still most popular `Newtonsoft.Json` library. At the time, there were many features missing compared to `Newtonsoft.Json`, and it was difficult to migrate. Now, 3 years on, it is easier.

# Direct parsing

Where you previously used `JToken.Parse`, use `JsonNode.Parse`. See the [documentation](https://docs.microsoft.com/en-us/dotnet/standard/serialization/system-text-json-use-dom-utf8jsonreader-utf8jsonwriter?pivots=dotnet-6-0#use-jsonnode) for more detail.

# Basic serialization

Where you previously used `JsonConvert.SerializeObject`, use `JsonSerializer.Serialize`. The options passed in are different: `Formatting.Indented` becomes a property on `JsonSerializerOptions`: `WriteIndented = true`. Other equivalents can be seen in the [migration table](https://docs.microsoft.com/en-us/dotnet/standard/serialization/system-text-json-migrate-from-newtonsoft-how-to?pivots=dotnet-6-0#table-of-differences-between-newtonsoftjson-and-systemtextjson): the most common are probably `ContractResolver = new CamelCasePropertyNamesContractResolver()` -> `PropertyNamingPolicy = JsonNamingPolicy.CamelCase`, `ReferenceLoopHandling = ReferenceLoopHandling.Ignore` -> `ReferenceHandler = ReferenceHandler.IgnoreCycles` (or `PreserveReferencesHandling = PreserveReferencesHandling.All` -> `ReferenceHandler = ReferenceHandler.Preservce`), and `NullValueHandling = NullValueHandling.Ignore` -> `DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull`.

Note that `System.Text.Json` by default [does not serialize properties of derived classes](https://docs.microsoft.com/en-us/dotnet/standard/serialization/system-text-json-polymorphism). The easiest way to work around this is to pass the type to the `Serialize` method: `JsonSerializer.Serialize(item, item.GetType())`.

A more complicated way to work around this is to write a converter, overriding `Write` to serialize to the specific types you want. Note that [if you pass in the options object, you'll get a stack overflow](https://docs.microsoft.com/en-us/dotnet/standard/serialization/system-text-json-migrate-from-newtonsoft-how-to?pivots=dotnet-6-0#required-properties). If you want to use a non-default options, you'll need to create a new options object (`new JsonSerializerOptions(options)`) with a `Converters` list that doesn't contain the converter you're currently writing.

After [NET 7.0](https://github.com/dotnet/runtime/issues/63747), the `JsonDerivedType` attribute will be able to be used for this.

# Basic deserialization

Where you previously used `JsonConvert.DeserializeObject`, use `JsonSerializer.Deserialize`. Adjust the options as described in the previous section. If you are accepting JSON which may come in an unknown case (e.g. Pascal / camel / other), set `PropertyNameCaseInsensitive = true` in the options.

Note that `System.Text.Json` does not support polymorphic deserialization until [NET 7.0](https://github.com/dotnet/runtime/issues/63747).

# Attributes

Attributes are mostly identically named -- e.g. `JsonConstructor`, `JsonConverter`. Some converters are slightly changed: e.g. `StringEnumConverter` to `JsonStringEnumConverter`. Autocomplete should find them.

# Configuring ASP.NET

In `ConfigureServices` in `Startup.cs`, replace

```csharp
services.AddControllers().AddNewtonsoftJson(opt => {
    opt.UseCamelCasing(true)
    opt.SerializerSettings.NullValueHandling = NullValueHandling.Ignore;
})
```

with

```csharp
services.AddControllers().AddJsonOptions(o => {
    var opts = o.JsonSerializerOptions;
    opts.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
})
```

changing options as appropriate. ASP.NET uses [web defaults](https://docs.microsoft.com/en-us/dotnet/standard/serialization/system-text-json-configure-options?pivots=dotnet-6-0#web-defaults-for-jsonserializeroptions) by default:
```
PropertyNameCaseInsensitive = true
JsonNamingPolicy = CamelCase
NumberHandling = AllowReadingFromString
```
so these don't have to be explicitly set.

If you have set up any other functionality to use `Newtonsoft.Json` (e.g. `AddSwaggerGenNewtonsoftSupport()`), remove this as well -- the default has been `System.Text.Json` since ASP.NET 3.0. After this, remove the packages `Newtonsoft.Json`, `Microsoft.AspNetCore.Mvc.NewtonsoftJson` and `Swashbuckle.AspNetCore.Newtonsoft` from your `csproj` files.
