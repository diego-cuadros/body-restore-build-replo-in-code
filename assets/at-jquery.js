jQuery(document).ready(function($){
/**    
const currentUrl1 = window.location.href;
const targetUrl1 = "https://mybodyrestore.com/products/body-restore-steamers-b"; 
  const sourceUrls1 = [
    "https://mybodyrestore.com/products/essence-tea-tree-shower-steamers",
    "https://mybodyrestore.com/products/citrus-aromatherapy-shower-steamers",
    "https://mybodyrestore.com/products/amore-rose-shower-steamers",
    "https://mybodyrestore.com/products/calm-bedtime-shower-steamers-lavender",
    "https://mybodyrestore.com/products/eucalyptus-shower-steamers",
    "https://ca.mybodyrestore.com/products/essence-tea-tree-shower-steamers",
    "https://ca.mybodyrestore.com/products/citrus-aromatherapy-shower-steamers",
    "https://ca.mybodyrestore.com/products/amore-rose-shower-steamers",
    "https://ca.mybodyrestore.com/products/calm-bedtime-shower-steamers-lavender",
    "https://ca.mybodyrestore.com/products/eucalyptus-shower-steamers"
  ]; 
  if (sourceUrls1.includes(currentUrl1)) {
    window.location.replace(targetUrl1);
  }

const currentUrl2 = window.location.href;
const targetUrl2 = "https://mybodyrestore.com/products/body-restore-steamers-1-b"; 
  const sourceUrls2 = [
    "https://mybodyrestore.com/products/collectors-edition-box-shower-steamers",
    "https://ca.mybodyrestore.com/products/collectors-edition-box-shower-steamers"
  ]; 
  if (sourceUrls2.includes(currentUrl2)) {
    window.location.replace(targetUrl2);
  }

const currentUrl3 = window.location.href;
const targetUrl3 = "https://mybodyrestore.com/products/beef-tallow-lip-mask-b"; 
  const sourceUrls3 = [
    "https://mybodyrestore.com/products/bergamot-beef-tallow-lip-mask",
    "https://mybodyrestore.com/products/vanilla-beef-tallow-lip-mask",
    "https://mybodyrestore.com/products/unscented-beef-tallow-lip-mask",
    "https://mybodyrestore.com/products/peppermint-beef-tallow-lip-mask",
    "https://ca.mybodyrestore.com/products/bergamot-beef-tallow-lip-mask",
    "https://ca.mybodyrestore.com/products/vanilla-beef-tallow-lip-mask",
    "https://ca.mybodyrestore.com/products/unscented-beef-tallow-lip-mask",
    "https://ca.mybodyrestore.com/products/peppermint-beef-tallow-lip-mask"
  ]; 
  if (sourceUrls3.includes(currentUrl3)) {
    window.location.replace(targetUrl3);
  }

const currentUrl4 = window.location.href;
const targetUrl4 = "https://mybodyrestore.com/products/body-restore-toner-pad-b"; 
  const sourceUrls4 = [
    "https://mybodyrestore.com/products/bakuchiol-toner-pads",
    "https://mybodyrestore.com/products/cooling-jelly-toner-pads",
    "https://ca.mybodyrestore.com/products/bakuchiol-toner-pads",
    "https://ca.mybodyrestore.com/products/cooling-jelly-toner-pads"
  ]; 
  if (sourceUrls4.includes(currentUrl4)) {
    window.location.replace(targetUrl4);
  }

const currentUrl5 = window.location.href;
const targetUrl5 = "https://mybodyrestore.com/products/goat-milk-soap-b"; 
  const sourceUrls5 = [
    "https://mybodyrestore.com/products/goat-milk-soap",
    "https://ca.mybodyrestore.com/products/goat-milk-soap"
  ]; 
  if (sourceUrls5.includes(currentUrl5)) {
    window.location.replace(targetUrl5);
  }

const currentUrl6 = window.location.href;
const targetUrl6 = "https://mybodyrestore.com/products/whipped-beef-tallow-b"; 
  const sourceUrls6 = [
    "https://mybodyrestore.com/products/whipped-beef-tallow-balm-lavender",
    "https://mybodyrestore.com/products/whipped-beef-tallow-balm-grapefruit",
    "https://mybodyrestore.com/products/whipped-beef-tallow-balm-copy",
    "https://mybodyrestore.com/products/whipped-beef-tallow-balm",
    "https://ca.mybodyrestore.com/products/whipped-beef-tallow-balm-lavender",
    "https://ca.mybodyrestore.com/products/whipped-beef-tallow-balm-grapefruit",
    "https://ca.mybodyrestore.com/products/whipped-beef-tallow-balm-copy",
    "https://ca.mybodyrestore.com/products/whipped-beef-tallow-balm"
  ]; 
  if (sourceUrls6.includes(currentUrl6)) {
    window.location.replace(targetUrl6);
  }

const currentUrl7 = window.location.href;
const targetUrl7 = "https://mybodyrestore.com/products/natural-collagen-mask-b"; 
  const sourceUrls7 = [
    "https://mybodyrestore.com/products/natural-collagen-mask-anti-aging",
    "https://mybodyrestore.com/products/natural-collagen-mask-hydrate",
    "https://mybodyrestore.com/products/natural-collagen-mask-brighten",
    "https://ca.mybodyrestore.com/products/natural-collagen-mask-anti-aging",
    "https://ca.mybodyrestore.com/products/natural-collagen-mask-hydrate",
    "https://ca.mybodyrestore.com/products/natural-collagen-mask-brighten"
  ]; 
  if (sourceUrls7.includes(currentUrl7)) {
    window.location.replace(targetUrl7);
  }

const currentUrl8 = window.location.href;
const targetUrl8 = "https://mybodyrestore.com/products/steam-eye-mask-b"; 
  const sourceUrls8 = [
    "https://mybodyrestore.com/products/steam-eye-mask-variety-30-pack",
    "https://ca.mybodyrestore.com/products/steam-eye-mask-variety-30-pack"
  ]; 
  if (sourceUrls8.includes(currentUrl8)) {
    window.location.replace(targetUrl8);
  }
    **/
  $('.template-steamer-landing .mbr_save_btn').click(function(e) {
    $('html, body').animate({
        scrollTop: $("#scrolltobundle").offset().top
    }, 800);
      e.preventDefault();
      return false;
});
});