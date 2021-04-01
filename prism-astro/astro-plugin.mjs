function getAttr(attributes, name) {
  for(let attr of attributes) {
    if(attr.name === name) return attr;
  }
}

function getAttrValue(attributes, name) {
  let attr = getAttr(attributes, name);
  return attr && attr.value[0].data;
}


export default function() {
  return {
    transform() {
      return {
        visitors: {
          html: {
            Element: {
              enter(node) {
                if(node.name !== 'code') return;
                const className = getAttrValue(node.attributes, 'class') || '';
                const classes = className.split(' ');

                let lang;
                for(let cn of classes) {
                  const matches = /language-(.+)/.exec(cn);
                  if(matches) {
                    lang = matches[1];
                  }
                }

                if(!lang) return;

                const code = node.children[0].data;

                const repl = {
                  type: 'InlineComponent',
                  name: 'Prism',
                  attributes: [
                    {
                      type: 'Attribute',
                      name: 'lang',
                      value: [{
                        type: 'Text',
                        raw: lang,
                        data: lang
                      }]
                    },
                    {
                      type: 'Attribute',
                      name: 'code',
                      value: [{
                        type: 'MustacheTag',
                        content: '`' + code + '`'
                      }]
                    }
                  ],
                  children: []
                };
                
                this.replace(repl);
              }
            }
          }
        },
        async finalize() {

        }
      };
    }
  };
}