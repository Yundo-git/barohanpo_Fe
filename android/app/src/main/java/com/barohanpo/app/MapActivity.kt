package com.barohanpo.app

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.kakao.vectormap.KakaoMap
import com.kakao.vectormap.MapLifeCycleCallback
import com.kakao.vectormap.MapView
import com.kakao.vectormap.OnMapReadyCallback

class MapActivity : AppCompatActivity() {

    private lateinit var mapView: MapView

    private val requestPermission = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        // 권한 승인 여부 확인 후 필요 시 위치 관련 기능 활성화
        val fineGranted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true
        val coarseGranted = permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        if (fineGranted || coarseGranted) {
            // 권한 승인됨: 지도 준비 후 위치 관련 기능 활성화 지점에서 처리
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        mapView = MapView(this)
        setContentView(mapView)

        ensureLocationPermission()

        // Kakao MapView 라이프사이클 및 준비 콜백 설정
        mapView.start(object : MapLifeCycleCallback() {
            override fun onMapDestroy() {
                // 지도 리소스 정리 시 필요한 처리
            }

            override fun onMapError(error: Exception?) {
                // 지도 초기화 에러 로깅 등 처리
                error?.printStackTrace()
            }
        }, object : OnMapReadyCallback {
            override fun onMapReady(kakaoMap: KakaoMap) {
                // 지도 준비 완료 시 카메라/마커 등 설정 가능
                // 예: 카메라 이동, UI 설정 등
                // kakaoMap.moveCamera(CameraUpdateFactory.newCenterPosition(LatLng(...)))
            }
        })
    }

    private fun ensureLocationPermission() {
        val needed = arrayOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        )
        val notGranted = needed.any { perm ->
            ContextCompat.checkSelfPermission(this, perm) != PackageManager.PERMISSION_GRANTED
        }
        if (notGranted) {
            requestPermission.launch(needed)
        }
    }

    override fun onResume() {
        super.onResume()
        mapView.onResume()
    }

    override fun onPause() {
        mapView.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        mapView.onDestroy()
        super.onDestroy()
    }
}
