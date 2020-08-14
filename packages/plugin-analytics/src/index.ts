import { IApi } from 'umi';

export default (api: IApi) => {
  const GA_KEY = process.env.GA_KEY;
  if (!api.userConfig.analytics && !GA_KEY) return;

  api.describe({
    key: 'analytics',
    config: {
      schema(joi) {
        return joi.object();
      },
    },
  });
  const { analytics = {} } = api.userConfig;
  const { baidu = false, ga = GA_KEY, gtag } = analytics || {};
  api.logger.log('insert analytics');

  const baiduTpl = (code: string) => {
    return `
    (function() {
      var hm = document.createElement('script');
      hm.src = 'https://hm.baidu.com/hm.js?${code}';
      var s = document.getElementsByTagName('script')[0];
      s.parentNode.insertBefore(hm, s);
    })();
  `;
  };

  const gaTpl = (code: string) => {
    return `
    (function(){
      if (!location.port) {
        (function (i, s, o, g, r, a, m) {
          i['GoogleAnalyticsObject'] = r;
          i[r] = i[r] || function () {
              (i[r].q = i[r].q || []).push(arguments)
            }, i[r].l = 1 * new Date();
          a = s.createElement(o),
            m = s.getElementsByTagName(o)[0];
          a.async = 1;
          a.src = g;
          m.parentNode.insertBefore(a, m)
        })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');
        ga('create', '${code}', 'auto');
        ga('send', 'pageview');
      }
    })();
  `;
  };
  const gtagTpl = function(id: string, key: string) {
    return `
    (function(){
      var data =  window.g_initialProps["${key}"];
      var script = document.createElement('script');
      script.src = 'https://www.googletagmanager.com/gtag/js?id=${id}';
      script.async = true;
      script.onload = function() {
        window.dataLayer = window.dataLayer || [];
        window.gtag = function() {
          window.dataLayer.push(arguments);
        };
        window.gtag('js', new Date());
        window.gtag('config', '${id}');
        data && window.gtag('set', data)
      };
      document.getElementsByTagName('head')[0].appendChild(script);
    })();
  `;
  };

  if (baidu) {
    api.addHTMLHeadScripts(() => [
      {
        content: 'var _hmt = _hmt || [];',
      },
    ]);
  }

  if (api.env !== 'development') {
    if (baidu) {
      api.addHTMLHeadScripts(() => [
        {
          content: baiduTpl(baidu),
        },
      ]);
    }
    if (ga) {
      api.addHTMLScripts(() => [
        {
          content: gaTpl(ga),
        },
      ]);
    }
    if (gtag.GA_MEASUREMENT_ID) {
      const { GA_MEASUREMENT_ID, SEND_DATA_KEY } = gtag;
      api.addHTMLScripts(() => [
        {
          content: gtagTpl(GA_MEASUREMENT_ID, SEND_DATA_KEY),
        },
      ]);
    }
  }
};
