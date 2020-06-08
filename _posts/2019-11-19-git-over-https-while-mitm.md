---
layout: post
title:  "Using Git over HTTPS through an SSL briged proxy"
tags: [technical, git, mitm, forcepoint]
---

I've recently joined an organisation that uses Forcepoint to monitor and SSL bridge all HTTPS connections. This means that connections to GitHub over HTTPS fail, as the GitHub certificate is replaced with Forcepoint's, with the error message

> SSL certificate problem: unable to get local issuer certificate

The solution given to this was to disable SSL verification for all HTTPS connections for git. I didn't like this solution as it involves removing all security (although I suppose that as all connections are decrypted and re-encrypted, all security is removed anyway). I set about finding a better solution, which is to add the root certificate for the bridge to the CA certificate store known to Git. It's already in the Windows certificate store, which allows programs like Chrome and Internet Explorer to work out of the box, but Git uses a different certificate store, and it doesn't know about these certificates.

**I.**

First, I had to find out what was changing the GitHub-provided certificate. I figured I could find this by getting the certificate that was being given to Git, that it was rejecting due to not knowing the root signer.

I found [serverfault question about displaying a remote certificate using OpenSSL](https://serverfault.com/questions/661978/displaying-a-remote-ssl-certificate-details-using-cli-tools), so I ran that.

{% highlight bash%}
echo | openssl s_client -showcerts -servername github.com -connect github.com:443 2>/dev/null | openssl x509 -purpose -noout -text
{% endhighlight %}

![](/assets/2019-11-19-openssl-show-certs.png)

This told me the name of the company in the Issuer CN: Forcepoint Cloud Web Enforcer CA.

**II.**

Next, I had to find the root certificate. The plan was to [view all certificates](https://superuser.com/questions/647036/view-install-certificates-for-local-machine-store-on-windows-7) and export the one with Forcepoint in the name as Base64 crt.

I found that I could use `mmc.exe` to do this: add a snap-in for certificates, view them, then export the correct one.

**III.**

After I had the root certificate, it was just a matter of [updating Git's certificate store](http://blog.majcica.com/2016/12/27/installing-self-signed-certificates-into-git-cert-store/) with the relevant certificate. I just copied the Forcepoint certificate at the bottom of the default file -- you could set `http.sslCAInfo` in Git to a different location if you can't modify the original file.

This worked for Windows, but not for WSL, which uses GnuTLS: I got the error `gnutls_handshake() failed: Key usage violation in certificate has been detected.` I fixed that by [recompiling git with openssl](https://github.com/paul-nelson-baker/git-openssl-shellscript/).

**IV.**

As all connections are changed to use certificates signed with the same root, installing the root certificate instead of never verifying SSL connections is actually no safer. It feels better to not have that in the configuration file, though!
