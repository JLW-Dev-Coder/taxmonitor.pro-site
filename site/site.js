<!--/site/site.js-->
  <script>
  (function () {
    function safeText(s) {
      return String(s || "").replace(/[<>]/g, "").trim();
    }

    var params = new URLSearchParams(window.location.search || "");
    var code = safeText(params.get("code"));
    var item = safeText(params.get("item"));

    var payBtn = document.getElementById("btn-pay");
    var payErr = document.getElementById("pay-error");
    var paySpin = document.getElementById("pay-spinner");
    var payLab = document.getElementById("pay-label");

    function setBusy(isBusy, label) {
      if (payBtn) payBtn.disabled = !!isBusy;
      if (paySpin) paySpin.classList.toggle("hidden", !isBusy);
      if (payLab && label) payLab.textContent = label;
    }

    async function startCheckout() {
      if (payErr) payErr.textContent = "";
      if (!code || !item) {
        if (payErr) payErr.textContent = "Missing code or plan selection.";
        return;
      }

      setBusy(true, "Redirecting…");

      try {
        var res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ code: code, item: item })
        });

        var data = await res.json().catch(function () { return {}; });
        if (!res.ok || !data.url) throw new Error((data && data.error) ? JSON.stringify(data.error) : "Checkout failed");

        window.location.href = data.url;
      } catch (e) {
        if (payErr) payErr.textContent = "Payment could not be started. Try again.";
        setBusy(false, "Pay now →");
      }
    }

    if (payBtn) payBtn.addEventListener("click", function (ev) {
      ev.preventDefault();
      startCheckout();
    });
  })();
</script>
