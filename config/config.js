module.exports = {
  /**
   * Name of the integration which is displayed in the Polarity integrations user interface
   *
   * @type String
   * @required
   */
  name: 'EchoTrail',
  /**
   * The acronym that appears in the notification window when information from this integration
   * is displayed.  Note that the acronym is included as part of each "tag" in the summary information
   * for the integration.  As a result, it is best to keep it to 4 or less characters.  The casing used
   * here will be carried forward into the notification window.
   *
   * @type String
   * @required
   */
  acronym: 'ET',
  defaultColor: 'light-gray',
  onDemandOnly: true,
  /**
   * Description for this integration which is displayed in the Polarity integrations user interface
   *
   * @type String
   * @optional
   */
  description:
    'Access data points detailing what processes are, how they typically behave, who wrote them, and Security Intel on how they are used by threat actors.',
  entityTypes: ['SHA256', 'MD5'],
  customTypes: [
    {
      key: 'windowsExecutableFile',
      regex: /[\w\-\.]{2,256}\.(?:exe)/
    }
  ],
  /**
   * An array of style files (css or less) that will be included for your integration. Any styles specified in
   * the below files can be used in your custom template.
   *
   * @type Array
   * @optional
   */
  styles: ['./styles/styles.less'],
  /**
   * Provide custom component logic and template for rendering the integration details block.  If you do not
   * provide a custom template and/or component then the integration will display data as a table of key value
   * pairs.
   *
   * @type Object
   * @optional
   */
  block: {
    component: {
      file: './components/block.js'
    },
    template: {
      file: './templates/block.hbs'
    }
  },
  summary: {
    component: {
      file: './components/summary.js'
    },
    template: {
      file: './templates/summary.hbs'
    }
  },
  request: {
    // Provide the path to your certFile. Leave an empty string to ignore this option.
    // Relative paths are relative to the integration's root directory
    cert: '',
    // Provide the path to your private key. Leave an empty string to ignore this option.
    // Relative paths are relative to the integration's root directory
    key: '',
    // Provide the key passphrase if required.  Leave an empty string to ignore this option.
    // Relative paths are relative to the integration's root directory
    passphrase: '',
    // Provide the Certificate Authority. Leave an empty string to ignore this option.
    // Relative paths are relative to the integration's root directory
    ca: '',
    // An HTTP proxy to be used. Supports proxy Auth with Basic Auth, identical to support for
    // the url parameter (by embedding the auth info in the uri)
    proxy: ''
  },
  logging: {
    level: 'info' //trace, debug, info, warn, error, fatal
  },
  /**
   * Options that are displayed to the user/admin in the Polarity integration user-interface.  Should be structured
   * as an array of option objects.
   *
   * @type Array
   * @optional
   */
  options: [
    {
      key: 'apiKey',
      name: 'EchoTrail API Key',
      description: 'API Key for the EchoTrail API',
      default: '',
      type: 'password',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'showMisses',
      name: 'Show Files that have not been Observed',
      description:
        "If checked, the integration will return a 'Not Observed' result for SHA256 hashes and files that have not been observed by EchoTrail.",
      default: true,
      type: 'boolean',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'suspiciousThreshold',
      name: 'Anomalous Process Threshold for SHA256',
      description:
        'SHA256 values with an EchoTrail prevalence score below or equal to this value will be flagged as anomalous. Defaults to 20. Set to -1 to disable. This option should be visible to all users. This option is only applicable to SHA256 lookups.',
      default: 20,
      type: 'number',
      userCanEdit: false,
      adminOnly: false
    },
    {
      key: 'commonThreshold',
      name: 'Common Process Threshold for SHA256',
      description:
        'SHA256 values with an EchoTrail prevalence score above or equal to this value will be flagged as a common process. Defaults to 80.  Set to -1 to disable. This option should be visible to all users. This option is only applicable to SHA256 lookups.',
      default: 80,
      type: 'number',
      userCanEdit: false,
      adminOnly: false
    }
  ]
};
