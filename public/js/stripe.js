import axios from 'axios';
import {showAlert} from './alerts';
const stripe=Stripe('pk_test_51JL9JUSCEcGAxowGDAXKfRHzWL4tpsxHOkEF810AomiLwnTIMRiIRmLJsfzK06NvgwoamzuCgxvC6JIaRGXbPoDe00D0EtaULS');

export const bookTour=async tourId=>{
    try{
    const session=await axios(`http://127.0.0.1:4000/api/v1/bookings/checkout-session/${tourId}`)
    console.log(session);
    await stripe.redirectToCheckout({
        sessionId:session.data.session.id
    });
    
}catch(err){
    console.log(err);
    showAlert('error',err);
}
};