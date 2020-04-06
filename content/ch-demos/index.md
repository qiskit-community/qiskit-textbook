These games and demos are a fun way to reinforce the concepts you’ll learn throughout your quantum computing journey. We’ll introduce these at appropriate places throughout the textbook, but they’re also all listed here so you can find them easily.

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



