<?php 
        $username="ed97a375-6d3c-4e46-a92e-b4cfe53d95b0";
        $password="WFFWHiC1Wcct";
        $URL="https://stream.watsonplatform.net/authorization/api/v1/token?url=https://stream.watsonplatform.net/speech-to-text/api";
        // create curl resource 
        $ch = curl_init(); 

        // set url 
        curl_setopt($ch, CURLOPT_URL, $URL); 
        
        // set credentials
        curl_setopt($ch, CURLOPT_USERPWD, "$username:$password");

        //return the transfer as a string 
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1); 

        // $output contains the output string 
        $output = curl_exec($ch); 

        // close curl resource to free up system resources 
        curl_close($ch);   
        echo $output;
?>