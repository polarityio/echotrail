'use strict';

polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  showCopyMessage: false,
  uniqueIdPrefix: '',
  defaultListSize: 5,
  init() {
    let array = new Uint32Array(5);
    this.set('uniqueIdPrefix', window.crypto.getRandomValues(array).join(''));
    console.info(this.get('viewMore'));
    if (!this.get('block._state')) {
      this.set('block._state', {});
      this.set('block._state.viewMore', {
        learnMore: false,
        paths: false,
        parents: false,
        grandparents: false,
        children: false,
        network: false,
        hashes: false,
        files: false
      });
    }
    this._super(...arguments);
  },
  actions: {
    toggleLearnMore() {
      this.toggleProperty('block._state.viewMore.learnMore');
    },
    viewMore(data) {
      this.toggleProperty('block._state.viewMore.' + data);
    },
    copyData: function () {
      // Save a copy of visibility state so we can restore after the copy action
      const viewMoreCopy = Object.assign({}, this.get('block._state.viewMore'));

      // Make all data visible
      Object.keys(this.get('block._state.viewMore')).forEach((key) =>
        this.set(`block._state.viewMore.${key}`, true)
      );

      Ember.run.scheduleOnce(
        'afterRender',
        this,
        this.copyElementToClipboard,
        `echotrail-container-${this.get('uniqueIdPrefix')}`
      );

      Ember.run.scheduleOnce('destroy', this, this.restoreCopyState, viewMoreCopy);
    }
  },
  copyElementToClipboard(element) {
    window.getSelection().removeAllRanges();
    let range = document.createRange();

    range.selectNode(typeof element === 'string' ? document.getElementById(element) : element);
    window.getSelection().addRange(range);
    document.execCommand('copy');
    window.getSelection().removeAllRanges();
  },
  restoreCopyState(viewMoreCopy) {
    this.set('showCopyMessage', true);
    Object.keys(viewMoreCopy).forEach((key) =>
      this.set(`block._state.viewMore.${key}`, viewMoreCopy[key])
    );

    setTimeout(() => {
      if (!this.isDestroyed) {
        this.set('showCopyMessage', false);
      }
    }, 2000);
  }
});
