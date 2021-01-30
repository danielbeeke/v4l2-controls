import { html, render } from 'https://cdn.skypack.dev/uhtml/async';

type Status = {
  [key: string]: {
    [key: string]: number | string,
  }
}

function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

class App {

  private element: HTMLDivElement
  private status: Status

  constructor() {
    this.element = document.querySelector('#app')
    this.draw()
    this.getStatus().then(status => {
      this.status = status
      this.draw()
    })
  }

  async getStatus () {
    const response = await fetch('http://10.46.1.45:7700/status/2')
    return await response.json()
  }

  draw () {
    const setSetting = debounce(async (setting, value) => {
      fetch(`http://10.46.1.45:7700/set/2/${setting}/${value}`)
    }, 200)

    render(this.element, html`
      <h1>Hello!</h1>
      ${this.status ? Object.entries(this.status).map(([setting, properties]) => properties.type === 'int' ? html`
        <h3>${setting}</h3>
        <input 
        type="range" 
        oninput="${(event) => setSetting(setting, event.currentTarget.value) }"
        min="${properties.min ?? null}" 
        max="${properties.max ?? null}" 
        value="${properties.value ?? null}" 
        step="${properties.step ?? null}"
        >
      ` : html``) : html``}
    `)
  }

}

const app = new App()