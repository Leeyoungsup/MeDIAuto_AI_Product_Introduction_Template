import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'./tests',timeout:60000,workers:1,use:{baseURL:'http://127.0.0.1:4173',launchOptions:{executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']},headless:true},webServer:{command:'npm run preview',url:'http://127.0.0.1:4173',reuseExistingServer:false},reporter:'list'});
