## Index of Games & Demos

Here is some text you'll see when accessing the demos and games page

<div class="index-cards">
<div class="row">
{% for entry in site.data.demostoc %}
  <div class="column">
  <a href="{{ site.baseurl }}{{ entry.url }}">
    <div class="card">
      <h3>{{ entry.title }}</h3>
      <p>{{ entry.description }}</p>
    </div>
  </a>
  </div>
{% endfor %}

  
  
</div>
</div>



