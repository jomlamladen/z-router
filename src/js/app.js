
  var Zrouter = (function() {

    /**
     * Private arguments & methods
     */
    var private = {
      routes : [],
      root : '/',
      el : '#z-router-view',
      interval: null,
      fetch : function(route, options) {
        // fetches the template if needed & compiles it then displayes it (to simulate caching, fetched data is inserted in the template )
        if (!!route.template){
          public.render(public.tp(route.template, options));
        }
        else if(!!route.templateUrl) {
          var xhttp = new XMLHttpRequest();
          xhttp.onreadystatechange = function() {
            if (xhttp.readyState == 4 && xhttp.status == 200) {
              public.render(public.tp(xhttp.responseText, options));
            }
          };
          xhttp.open("GET", route.templateUrl, true);
          xhttp.send();
        }
      }
    };

    /**
     * Private arguments & methods
     */
    var public = {
      // getters
      get : {
        fragment: function() {
            var match = window.location.href.match(/#(.*)$/),
                fragment = match ? match[1] : '';
            return fragment.toString().replace(/\/$/, '').replace(/^\//, '');
        },
        routes : function() {
          return JSON.stringify(private.routes);
        },
        route : function(f) {
          var routeFound = private.routes.map(function(x) { return x.route; }).indexOf(f);
          if (routeFound != -1) return private.routes[routeFound];
          return null;
        }
      },
      //setters
      set : { //return public; (will allow methods chaining)
        root : function(root) {
          private.root = root;
          return public;
        },
        route : function(route) {
          if(typeof route == "object") {
            if(!!route.name && !!route.url && !!route.callback && (!!route.template || !!route.templateUrl)) private.routes.push(route);
            else console.log('The route named "'+route.name+'" can\'t be added');
          }
          else if(typeof route == "function") {
            private.routes.push({name : "root", url: "", callback: route, template:"404"});
          }
          return public;
        }
      },
      //other functions
      remove: function(routeName) {
        var routeInRoutes = private.routes.map(function(a) { return a.name; }).indexOf(routeName)
        if(routeInRoutes != -1) private.routes.splice(routeInRoutes, 1);
        else console.log('The route named "'+routeName+'" doesn\'t exist');
        return public;
      },
      check: function(f){
        // checks the current fragment and calls render method if it has changed
        var fragment = f || public.get.fragment();
        for(var i = 0; i < private.routes.length; i++) {
            var match = fragment.match(private.routes[i].url);
            if(match) {
                match.shift();
                var route = private.routes[i];
                private.fetch(route, match);
                return public;
            }
        }
        return public;
      },
      listen: function() {
        // calls every 50ms the check methode and compares the current fragment with the one that has been stored at last route change
        var current = null; // to be sure it will be fired onload
        var fn = function() {
            if(current !== public.get.fragment()) {
                current = public.get.fragment();
                public.check(current);
            }
        };
        clearInterval(private.interval);
        private.interval = setInterval(fn, 50);
        return public;
      },
      render : function(data) {
        // rendrers the template (downloads it before if the route has a template url & is not yet in the cache) + loader
        // should pass in tp function only if it has options
        // should only pass in tp function when in cache but url has changed
        document.querySelector(private.el).innerHTML = data;
      },
      navigate : function(path) {
        path = path ? path : '';
        window.location.href = window.location.href.replace(/#(.*)$/, '') + '#' + path;
        return public;
      },
      tp : function (html, options) {
        //pass the html and options in and this will return the html populated with the options data
        // http://krasimirtsonev.com/blog/article/Javascript-template-engine-in-just-20-line
        var re = /<%([^%>]+)?%>/g,
            reExp  = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g,
            code   = 'var r=[];\n',
            cursor = 0,
            match;
        var add = function(line, js) {
            js? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') :
                (code += line !== '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
            return add;
        };
        while(match = re.exec(html)) {
            add(html.slice(cursor, match.index))(match[1], true);
            cursor = match.index + match[0].length;
        }
        add(html.substr(cursor, html.length - cursor));
        code += 'return r.join("");';
        return new Function(code.replace(/[\r\t\n]/g, '')).apply(options);
      }
    };

    /**
     * Expose only the public things
     */
    return public;
  })();


Zrouter
  .set.route({
    name : 'Test1',
    url  : /test1/,
    template : '<p>This is an inline template</p>',
    callback : function(){
      console.log("111", arguments);
    }
  })

  .set.route({
    name  : 'Test2',
    url : /test2\/(.*)/,
    templateUrl : 'partials/test2.html',
    callback : function() {
      console.log("222", arguments);
    }
  })

  .set.route(function(){
    console.log("coucou");
  })

  .listen()
