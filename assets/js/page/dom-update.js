const runWhenDOMLoaded = cb => {
  if (document.readyState != 'loading') {
    cb()
  } else if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', cb)
  } else {
    document.attachEvent('onreadystatechange', function() {
      if (document.readyState == 'complete') cb()
    })
  }
}

// Helper function to init things quickly
initFunction = function(myfunc) {
  runWhenDOMLoaded(myfunc);
  document.addEventListener('turbolinks:load', myfunc);
};

// Helper function to load scripts asynchronously. Return a promise resolved
// when the script is loaded.
window._asyncScripts = {}
loadAsyncScript = function(url) {
  if (!window._asyncScripts.hasOwnProperty(url)) {
    window._asyncScripts[url] = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.async = true
      script.src = url
      document.head.appendChild(script)
      script.onload = resolve
      script.onerror = (err) => {
        console.error('Error loading async script:', url)
        reject(err)
      }
    })
  }
  return window._asyncScripts[url]
};