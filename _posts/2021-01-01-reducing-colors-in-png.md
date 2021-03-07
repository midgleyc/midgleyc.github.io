---
layout: post
title:  "Reducing the Number of Colors in a PNG"
tags: [technical, image, imagemagick]
---

My dad recently asked that I reduce the number of colors in a [clip-art icon of a server](https://icon-library.com/icon/server-icon-13.html), so he could recolor it to red (downloading the image shows it's made of stripes of slightly different colors, probably because it's been saved as a JPG).

I used ImageMagick for this because I'm not well aware of graphical tools.

First I converted the saved JPG to a PNG.

```bash
convert server-icon-13.jpg server.png
```

Second I created a swatch with the colors I wanted: dark gray and transparent.

```bash
convert xc:"rgb(51, 62, 73)" xc:"rgba(255, 255, 255, 0)" +append swatch.png
```

Finally I recolored the server to have the colormap of the swatch.

```bash
convert server.png +dither -remap swatch.png server-less.png
```

This gave a server with a transparent background and a solid gray foreground.

After this, Dad was able to recolor the server in Paint or, more interestingly, apply recolor filters in PowerPoint to easily shift to a predetermined series of colors. We weren't able to find an option to shift to _any_ color, though.
