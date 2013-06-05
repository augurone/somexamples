$(function() {
    var timer;
	bodywdi = parseInt(self.innerWidth);
	bodywd = Math.round(bodywdi)
    hdht = parseInt($('#header').height());
    sldrwd = parseInt($('#bkslidewr').width());
    sldcnt = $('.bksld').length;
    mvleft = (sldrwd / sldcnt)
    $('#masterwr').css({
        height: ((bodywd * .62) - hdht)
    });
    mht = $('#masterwr').height();
    $(window).resize(function() {
        bodywdi = parseInt(self.innerWidth);
		bodywd = Math.round(bodywdi)
        mht = $('#masterwr').height();
        hdht = parseInt($('#header').height());
        sldrwd = parseInt($('#bkslidewr').width());
        mvleft = (sldrwd / sldcnt)
        $('#masterwr').width() > 800 ? $('#masterwr').css({height: ((bodywd * .62) - hdht)}) : $('#masterwr').css({height: 504});
        $('#bkslidewr').clearQueue().animate({'left': 0}, function() {
            $('.sldbt.active').removeClass('active');
            $('.sldbt:first-of-type').addClass('active');
        });
        clearTimeout(timer);
    });
    $.each($('.bksld'), function(e) {
        e != 0 ? $('#sldnav').append('<span indx="' + e + '" class="sldbt">•</span>') : $('#sldnav').append('<span indx="' + e + '" class="sldbt active">•</span>')
    })
    $('.sldbt').bind('click', function() {
        index = parseInt($(this).attr('indx'));
        $('.sldbt.active').removeClass('active');
        $(this).addClass('active');
        $('#bkslidewr').clearQueue().animate({'left': -index * mvleft }, function() { z = index; });
        clearTimeout(timer);
    });
    z = 0;
    ds = 8000;
    function animate_element() {
        sbt = $('.sldbt')[z + 1]
        z < sldcnt - 1 ? $('#bkslidewr').delay(ds).animate({ left: "-=" + mvleft}, function() {z = z + 1; $('.active').removeClass('active'); $(sbt).addClass('active');}) : $('#bkslidewr').delay(ds).animate({left: 0}, 0, function() { z = 0; $('.active').removeClass('active'); $('.sldbt:first-of-type').addClass('active');});
        ds = 7000;
        timer = setTimeout(animate_element, ds + 1000);
    };
    $('a.externals').bind('click', function() {
        _gaq.push(['_trackEvent', 'Marin', 'Bikes', 'filmpunks raffle page']);
    });
    //The fbFetch SCRIPT WAS WRITTEN BY fridayarts LLC with lots of help from all over the web turtorial to come with references once I find them again. 
    function fbFetch() {
        //Set Url of JSON data from the facebook graph api. make sure callback is set with a '?' to overcome the cross domain problems with JSON
        var url = "https://graph.facebook.com/238426509539034/feed?access_token=AAABs1lZAjKCABAIwrrzD36790iZCg7GLDfoblOdZAlffFI2d01V4ZAlPlNyIVVGfmd0N08SXLc8Qt3CGTDsPKZBLz8QFor7sZD&expires_in=0&code=AQCssxlRcumWCKe7AhtWozOwk1HFTmdEGMzYj6sYJ5UfXNRWFKOHnDBLVokNX5psn5bJNV-d2sXUiO3DbXhessM4lTosAJUsWUWPavmZA3eNFqHVijlEnT181WIIT4LSMwEUnRFVbaxTS25Pesd9kLjQUvvmjNZCNt-5RHBYFZnLMYdMQqvCR2SjJwaLk1FM7AMw&callback=?"
        //Use jQuery getJSON method to fetch the data from the url and then create our unordered list with the relevant data.
        $.getJSON(url, function(json) {
            starr = [];
            $.each(json.data, function(i, fb) {
                //***************Data Types loosely defined, does not always apply consistently.******************\\
                console.log(fb); //uncomment the console statement to check available fields. 
                //link: actions, captions, comments, created_time, descrtiption, from, icon, id, link, message, name, picture, type, updated_time
                //photo: actions, comments, created_time, from, icon, id, likes, link, name, object_id, picture, story/message, story_tags, type, updated_time
                //status: actions, comments, created_time, from, id, message, to, type, updated_time 
                //video: actions, application, caption, comments, created_time, description, from, icon, id, likes, links, name, picture, source, story, story_tags, type, updated_time.                                        
                //Build URLS from data because they are not always available.                     
                fbid = fb.id;
                fbpid = fbid.split('_')[0];
                fboid = fbid.split('_')[1];
                fbl = 'https://www.facebook.com/' + fbpid + '/posts/' + fboid
                fblcl = fbl.split('//')[1];
                fbls = '<a href="' + fbl + '" target="_blank">';
                //Annoying iFrame code
                like = '<iframe class="fb-like" src="//www.facebook.com/plugins/like.php?href='+fblcl+'&amp;send=false&amp;layout=standard&amp;width=49&amp;show_faces=false&amp;action=like&amp;colorscheme=light&amp;font=arial&amp;height=27&amp;appId=119667828140064" scrolling="no" frameborder="0" allowTransparency="true"></iframe>';
                fbf = '<h3>' + fb.from.name+'</h3>';
                //FBSF conditionals
                fbm = fb.message;
                fbms = '<p>' + fbm + '</p>';
                fbs = fb.story;
                fbss = '<p>' + fbs + '</p>';
                fbd = fb.description;
                fbds = '<p>' + fbd + '</p>';
                fbn = '<p>' + fb.name + '</p>';
				fbl = '<a href="' + fb.link +'</a>';
                //loop through and within data array's retrieve the message variable.
                fbm == undefined ? fbs == undefined ? fbd == undefined ? fbsf = fbn : fbsf = fbd : fbsf = fbss : fbsf = fbms
                //FBPS conditionals
                fbp = fb.picture;
                fbi = '<img src="' + fb.icon + '"/>';
                fbp == undefined ? fbps = fbi : fbps = '<img src="' + fbp + '"/>';
				console.log(fb)
                owp = '<li class="' + fb.type + '"><div class="fbhead">'+fbls+fbf+'</a></div><div class="fbtext">' + fbsf + '<div class="fbimg">' + fbps + '</div>'+like + '</div></li>';
                onp = '<li class="' + fb.type + '"><div class="fbhead">'+fbls+fbf+'</a></div><div class="fbtext">' + fbsf + like + '</div></li>';
				owl = '<li class="' + fb.type + '"><div class="fbhead">'+fbls+fbf+'</a></div><div class="fbtext">' + fbsf + like + '</div></li>';
                fb.type != 'status' ? build = owp : fb.type=='link' ? build =owl : build = onp;
                starr.push(build);
            });
            stjoin = []
            stjoin.push('<ul id="fbfeed" class="bkgrdarktop">' + starr.join('') + '</ul>')
            $('#fbchannel').append(stjoin.join(''));
        })

    };
    var vidst;
/*litem = $('#ytplayer1').find('li');
  function ytprevs(){ 
    $this = $('#ytplayer1 li.prev');
    $next = $this.next;
    last =  $('ul#ytplayer1 li:last-of-type');
    $this.removeClass('prev').animate({opacity:1}, 0, function(){$(last).prependTo('#ytplayer1').addClass('prev'); });
    vidst= setTimeout(ytprevs, 8000);  
  }*/ //To un/animate the video preview un/comment the function 
    function ytFetch() {
        var url = "https://gdata.youtube.com/feeds/api/videos?q=TheFilmpunks&max-results=4&v=2&alt=jsonc";
        $.getJSON(url, function(json) {
            yttarr = [];
            pid = '';
            $.each(json.data.items, function(i, yt) {
                i == 0 ? pid = yt.id : pid = pid;
                i == 0 ? lgthb = '<li class="prev"><div id="vidgrad" class="gradient"></div><a href ="https://www.youtube.com/watch?v=' + yt.id + '" target="_blank"><img class="plbt" src="public/img/plbt.png" /></a><img class="ytthumb" src="' + yt.thumbnail.hqDefault + '"/><span class="vidblock"><h3>'+yt.title+'</h3><p>'+yt.description+'</p></span></li>' : lgthb = '<li><a href ="https://www.youtube.com/watch?v=' + yt.id + '" target="_blank"><img class="ytthumb" src="' + yt.thumbnail.hqDefault + '"/></a></li>';
                yttarr.push(lgthb);
            });
            $('#ytplayer1').append(yttarr.join(''));
            vidwc = parseInt($('#youtubechannel').width());
            vidhm = parseInt($('#youtubechannel').height());
            vidw = Math.round(vidwc);
            vidhc = vidw * 0.5625
            vidhcs = vidhc + '%';
            vidh = Math.round(vidhc);
            //inityt();
        });
    };
    ytFetch();
    animate_element();
    function inityt() {
        var params = { allowScriptAccess: "always"};
        var empar = 'http://www.youtube.com/apiplayer?video_id=' + pid + '&enablejsapi=1&version=3&playerapiid=ytplayer&start=26&controls=1&fs=0&rel=0&showinfo=0&showsearch=0&rel=0';
        swfobject.embedSWF(empar, "ytplayer", "100%", "112.6%", "8", "public/js/expressInstall.fla", null, params);
    }
});
