---
layout: post
title:  "Digital Drill Data Systems vs Petrolink: A Hacking Case"
tags: [personal, current, law]
---

I occasionally enjoy reading legal judgements for interesting interpretations of the law and crazy behaviour companies and people manage to get up to. [Digital Drilling Data Systems, LLC v. Petrolink Services, Inc., No. 19-20116 (5th Cir. 2020)](http://web.archive.org/web/20201116203728/https://cases.justia.com/federal/appellate-courts/ca5/19-20116/19-20116-2020-07-02.pdf) does not disappoint. I first looked into this after it was linked off the [youtube-dl GitHub DMCA reversal by the EFF](https://github.com/github/dmca/blob/master/2020/11/2020-11-16-RIAA-reversal-effletter.pdf).

It was linked in support of the idea that if YouTube presents a key that a program can use to decode a video, decoding that video with the key isn't hacking. I looked into it because I saw that it was a decision by an appeals court -- that meant the district court had gone the other way, and I wanted to see how the argument had gone to come to that conclusion.

The introduction reveals that the case really isn't like what youtube-dl does at all -- Digital Drilling left a dataset secured with the default username and password, and Petrolink used that username and password to access it without paying for the data. I understood why [the district court found against Petrolink](http://web.archive.org/web/20201116221009/https://cases.justia.com/federal/district-courts/texas/txsdce/4:2015cv02172/1283623/157/0.pdf) -- in my experience in the tech sector there's a sense that you shouldn't access things people try to secure against you, even if you know the authentication details, unless you've been given them. It's the knowledge that you're doing something you shouldn't be doing. Something bad.

Petrolink didn't recognise this and deployed their solution to over 300 computers on customer sites before being sued. It might have been worth it -- it helped them keep a $2.4m / year customer, and cost them $414k at district court, and $1m in lawyer fees that they might get back due to the DMCA failure.

Digidrill also went for the standard practice of making as many claims as possible: not terms of service violation, because they'd have to sue their own customers (who were also Petrolink's customers) and that's a bad look, but unfair competition, unjust enrichment and fraud in addition to more esoteric claims like trademark dilution and copyright infringement (and DMCA violation). I'm not sure how the trademark dilution argument went, but the copyright argument said essentially that Petrolink copied Digidrill's database, which was copyrighted, therefore it's infringement. The district court found that the data -- the actually important bit! -- couldn't be copyrighted because it was factual, but that the schema was a creative work and therefore copyrightable, and as Petrolink's program used the schema -- even if only in its source code and working memory -- this was a potential copyright violation. As a developer, this is annoying, as Petrolink wanted the data and only cared about the schema as a way to get the data, while Digidrill's data is actually valuable and deserving of protection. Perhaps copyright law is just totally the wrong area for this.

Indeed, the court agrees, and argues that not only did Petrolink only use a small amount (5%) of the schema, the exact layout of the schema wasn't important to Digidrill qualitatively, so the copyright claim fails. The data part falls under "unjust enrichment". Petrolink argues that this should also fail because it's preempted by the Copyright Act. This is a complicated legal argument that I don't really understand, but the gist is that both parties agree that the data is covered by copyright, and then Petrolink in a different section argues that in fact it's just facts and so there should be no penalty for infringement. Digidrill argues it shouldn't be preempted because even though it is a copyright matter, Petrolink induced their customers to break Digidrill's terms of service, which was wrong ("unjust") (if not illegal), which means it should be considered separately to the copyright claims.

I normally enjoy this level of arguing about what words mean, but this was too complicated for me. This reaches another level later where the appeals court argues that the district court shouldn't have denied Petrolink's claim for attorney's fees by arguing that because Digidrill's unjust enrichment claim wasn't preempted by the copyright infringement claim, it wasn't a copyright claim, despite both parties arguing that the data **was** covered by copyright.

The other interesting legal item here is that a DMCA claim for circumventing protection to a copyrighted item can go ahead even if the item wasn't infringed. This makes some sense but also feels like being convicted only of resisting arrest. Of course, had the database been covered by an adequate password instead of a default password, it's conceivable that Digidrill could have won the DMCA claim by not the infringement claim.