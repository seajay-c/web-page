/**
 * forms.js — Client-side demo validation (no backend)
 * ---------------------------------------------------------------------------
 * Used by contact/index.html and careers/apply.html.
 *
 * Pattern:
 *   - Forms opt in with data-validate="demo"
 *   - Required fields use the required attribute + aria-required
 *   - On submit we preventDefault, validate, toggle .is-invalid + live errors
 *   - On success we show a nearby [data-form-success] alert and reset the form
 *
 * This intentionally does NOT send network requests — perfect for a static
 * GitHub Pages demo.
 */

(function () {
  "use strict";

  function isEmail(value) {
    // Pragmatic check for demos — not a full RFC parser
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function clearFieldErrors(form) {
    form.querySelectorAll(".form-field.is-invalid").forEach(function (field) {
      field.classList.remove("is-invalid");
    });
  }

  function markInvalid(field, message) {
    field.classList.add("is-invalid");
    var error = field.querySelector(".field-error");
    if (error && message) error.textContent = message;
  }

  function validateField(field) {
    var input = field.querySelector("input, select, textarea");
    if (!input) return true;

    var value = (input.value || "").trim();
    var required = input.hasAttribute("required");

    if (required && !value) {
      markInvalid(field, "This field is required.");
      return false;
    }

    if (input.type === "email" && value && !isEmail(value)) {
      markInvalid(field, "Enter a valid email address.");
      return false;
    }

    if (input.type === "tel" && value && value.replace(/\D/g, "").length < 7) {
      markInvalid(field, "Enter a phone number with at least 7 digits.");
      return false;
    }

    return true;
  }

  function initForm(form) {
    var success = form.parentElement.querySelector("[data-form-success]") ||
      document.querySelector("[data-form-success][data-for='" + form.id + "']");

    form.setAttribute("novalidate", "novalidate");

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      clearFieldErrors(form);
      if (success) success.hidden = true;

      var fields = form.querySelectorAll(".form-field");
      var ok = true;
      var firstInvalid = null;

      fields.forEach(function (field) {
        if (!validateField(field)) {
          ok = false;
          if (!firstInvalid) firstInvalid = field.querySelector("input, select, textarea");
        }
      });

      if (!ok) {
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // Demo success path — pretend the request succeeded
      form.reset();
      if (success) {
        success.hidden = false;
        success.focus();
      }
    });

    // Clear error state as the user edits
    form.addEventListener("input", function (event) {
      var field = event.target.closest(".form-field");
      if (field) field.classList.remove("is-invalid");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll('form[data-validate="demo"]').forEach(initForm);
  });
})();
