package com.barohanpo.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // No need to manually register the Geolocation plugin
        // It will be auto-registered by Capacitor
    }
}