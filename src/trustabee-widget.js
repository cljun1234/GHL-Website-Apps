class TrustabeeWidget extends HTMLElement {
  constructor() {
    super();
  }

  static get observedAttributes() {
    return ['location-id'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'location-id' && oldValue !== newValue) {
      this.render();
    }
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const locationId = this.getAttribute('location-id');

    // Check if locationId is present
    if (!locationId) {
      console.warn('TrustabeeWidget: location-id attribute is missing.');
      return;
    }

    const scriptUrl = `https://staging-trustabee.elefity.com/api/widget.js?w=${encodeURIComponent(locationId)}`;

    // Prevent duplicate injection
    if (document.head.querySelector(`script[src="${scriptUrl}"]`)) {
      return;
    }

    // Create the script element
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;

    // Error handling for script loading
    script.onload = () => {
      console.log(`TrustabeeWidget: Script loaded successfully for location ${locationId}`);
    };

    script.onerror = () => {
      console.error(`TrustabeeWidget: Failed to load script for location ${locationId}`);
    };

    // Append to document head (or body)
    document.head.appendChild(script);
  }
}

// Define the custom element
customElements.define('trustabee-widget', TrustabeeWidget);
