import { defineConfig } from 'jsrepo';

export default defineConfig({
  registries: [
    {
      url: 'https://reactbits.dev/r',
      paths: {
        '*': './components/reactbits',
      },
    },
  ],
  paths: {
    '*': './components/reactbits',
		component: './components/reactbits'
  },
});
