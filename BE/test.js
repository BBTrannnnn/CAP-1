const client_id= "803477306737-pvvd5qe1dkj602h4lkr3f5ed11tksgb4.apps.googleusercontent.com"

// /auth/userinfo.email
//  /auth/userinfo.profile

 const_Link_Get_Token=`https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/userinfo.email%20https://www.googleapis.com/auth/userinfo.profileresponse_type=token&state=state_parameter_passthrough_value& redirect_uri=http://localhost:5000/api/users/googleclient_id=${client_id}`