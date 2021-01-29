この章のゲームとデモは、量子コンピューティングを楽しく学ぶためのものです。テキストブック内の適切なところで紹介しますが、簡単に見つけられるようにすべてここにリストしています。


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



