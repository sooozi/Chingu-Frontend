'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { getCookieValue } from '@/utils/cookie';

type AlbumDetail = {
  memoryId: number;
  groupId: number;
  nickname: string;
  title: string;
  content: string;
  imageUrl1?: string;
  imageUrl2?: string;
  imageUrl3?: string;
  location?: string;
  memoryDate: string;
  createdAt: string;
  description?: string;
  imageUrl?: string;
  albumTitle?: string;
  albumContent?: string;
  albumLocation?: string;
  albumImage?: string;
  albumImage2?: string;
  albumImage3?: string;
  name?: string;
  place?: string;
  address?: string;
  albumName?: string;
  memoryTitle?: string;
  memoryContent?: string;
  memoryLocation?: string;
};

interface EditFormData {
  title: string;
  content: string;
  imageUrl1: string;
  imageUrl2: string;
  imageUrl3: string;
  location: string;
  memoryDate: string;
}

function AlbumDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = searchParams.get('groupId');
  const albumId = searchParams.get('albumId');

  const [albumDetail, setAlbumDetail] = useState<AlbumDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    title: '',
    content: '',
    imageUrl1: '',
    imageUrl2: '',
    imageUrl3: '',
    location: '',
    memoryDate: '',
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [canUploadToday, setCanUploadToday] = useState(true);
  const [lastUploadDate, setLastUploadDate] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId || !albumId) {
      setError('필요한 정보가 없습니다.');
      setLoading(false);
      return;
    }

    // 토큰 상태 확인
    const accessToken = getCookieValue('accessToken');
    if (!accessToken) {
      setError('로그인이 필요합니다.');
      setLoading(false);
      return;
    }

    const checkUploadLimit = () => {
      // 하루 1개 업로드 제한 체크
      const today = new Date().toDateString();
      const groupUploadKey = `albumUpload_${groupId}_${today}`;
      const storedDate = localStorage.getItem(groupUploadKey);

      if (storedDate === today) {
        setCanUploadToday(false);
        setLastUploadDate(storedDate);
      } else {
        setCanUploadToday(true);
        setLastUploadDate(storedDate);
      }
    };

    checkUploadLimit();

    // 자정까지 남은 시간 계산하여 한 번만 체크
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    // 자정에 한 번만 체크
    const timeoutId = setTimeout(checkUploadLimit, timeUntilMidnight);

    const fetchAlbumDetail = async () => {
      try {
        // 앨범 상세 정보 조회 - 새로운 API 엔드포인트 사용
        const response = await fetch(
          `/api/groups/${groupId}/albums/${albumId}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.ok) {
          const album = await response.json();
          console.log('[앨범 상세] API 응답:', album);
          setAlbumDetail(album);
        } else {
          const errorText = await response.text();
          console.error('[앨범 상세] API 오류:', response.status, errorText);
          setError('앨범 정보를 불러오는데 실패했습니다.');
        }
      } catch (err) {
        console.error('[앨범 상세 조회 오류]', err);
        setError('앨범 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchAlbumDetail();

    return () => clearTimeout(timeoutId);
  }, [groupId, albumId]);

  // 날짜 포맷팅 (표시용)
  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 이미지 URL 배열 생성
  const getImageUrls = (album: AlbumDetail) => {
    const urls = [];
    if (album.imageUrl1) urls.push(album.imageUrl1);
    if (album.imageUrl2) urls.push(album.imageUrl2);
    if (album.imageUrl3) urls.push(album.imageUrl3);
    if (album.imageUrl) urls.push(album.imageUrl);
    if (album.albumImage) urls.push(album.albumImage);
    return urls;
  };

  // 앨범 삭제 함수
  const handleDeleteAlbum = async () => {
    if (!confirm('정말로 이 앨범을 삭제하시겠습니까?')) {
      return;
    }

    setIsDeleting(true);

    try {
      const accessToken = getCookieValue('accessToken');
      if (!accessToken) {
        alert('로그인이 필요합니다.');
        return;
      }

      const response = await fetch(`/api/groups/${groupId}/albums/${albumId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        alert('앨범이 삭제되었습니다.');
        router.back();
      } else {
        const errorText = await response.text();
        console.error('[앨범 삭제] API 오류:', response.status, errorText);

        if (response.status === 403) {
          alert('작성자만 삭제할 수 있습니다.');
        } else {
          alert('앨범 삭제에 실패했습니다.');
        }
      }
    } catch (err) {
      console.error('[앨범 삭제 오류]', err);
      alert('앨범 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  // 앨범 수정 함수
  const handleEditAlbum = () => {
    if (albumDetail) {
      setEditFormData({
        title: albumDetail.title || '',
        content: albumDetail.content || '',
        imageUrl1: albumDetail.imageUrl1 || '',
        imageUrl2: albumDetail.imageUrl2 || '',
        imageUrl3: albumDetail.imageUrl3 || '',
        location: albumDetail.location || '',
        memoryDate: albumDetail.memoryDate || '',
      });

      // 기존 이미지들 미리보기 추가
      const existingImages = [
        albumDetail.imageUrl1,
        albumDetail.imageUrl2,
        albumDetail.imageUrl3,
      ].filter(Boolean) as string[];
      setImagePreviews(existingImages);
      setSelectedFiles([]);

      setShowEditModal(true);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 하루 1개 업로드 제한 체크
    if (!canUploadToday) {
      alert(
        '하루에 1개의 앨범만 업로드할 수 있습니다. 내일 다시 시도해주세요.'
      );
      e.target.value = '';
      return;
    }

    const files = Array.from(e.target.files || []);

    // 최대 3장 제한
    const MAX_IMAGES = 3;
    if (selectedFiles.length + files.length > MAX_IMAGES) {
      alert(`최대 ${MAX_IMAGES}장까지만 업로드할 수 있습니다.`);
      e.target.value = '';
      return;
    }

    if (files.length > 0) {
      // 파일 검증
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

      for (const file of files) {
        if (file.size > maxSize) {
          alert('파일 크기는 5MB 이하여야 합니다.');
          e.target.value = '';
          return;
        }
        if (!allowedTypes.includes(file.type)) {
          alert('JPG, PNG 파일만 업로드 가능합니다.');
          e.target.value = '';
          return;
        }
      }

      const newFiles = [...selectedFiles, ...files];
      setSelectedFiles(newFiles);

      // 새로 추가한 파일 미리보기 생성 (메모리 최적화)
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          setImagePreviews((prev) => [...prev, reader.result as string]);
        };
        reader.onerror = () => {
          console.error('파일 읽기 실패:', file.name);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateAlbum = async () => {
    // 중복 실행 방지
    if (isEditing) return;
    setIsEditing(true);

    // 새 이미지를 추가하는 경우에만 하루 제한 확인
    if (selectedFiles.length > 0 && !canUploadToday) {
      alert(
        '하루에 1개의 앨범만 업로드할 수 있습니다. 내일 다시 시도해주세요.'
      );
      setIsEditing(false);
      return;
    }

    try {
      const accessToken = getCookieValue('accessToken');
      if (!accessToken) {
        alert('로그인이 필요합니다.');
        return;
      }

      // 새로 선택된 이미지들 업로드
      const uploadedImageUrls: string[] = [];

      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';

          try {
            console.log(`[앨범 수정 이미지 업로드 시도] ${file.name}`);

            const presignRes = await fetch(
              `/api/albums/${groupId}/upload-url?extension=${ext}`,
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );

            if (presignRes.ok) {
              const responseData = await presignRes.json();

              const uploadUrl =
                responseData.uploadUrl ||
                responseData.presignedUrl ||
                responseData.url ||
                responseData.additionalProp1 ||
                Object.values(responseData)[0];
              const fileUrl =
                responseData.fileUrl ||
                responseData.publicUrl ||
                responseData.downloadUrl ||
                responseData.additionalProp2 ||
                Object.values(responseData)[1];

              if (uploadUrl) {
                // S3로 이미지 업로드 (타임아웃 설정)
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃

                try {
                  const uploadResponse = await fetch(uploadUrl, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': file.type,
                    },
                    body: file,
                    signal: controller.signal,
                  });

                  if (uploadResponse.ok) {
                    const finalUrl = fileUrl || uploadUrl.split('?')[0];
                    uploadedImageUrls.push(finalUrl);
                    console.log(`[앨범 수정 이미지 업로드 성공] ${file.name}`);
                  } else {
                    console.error(
                      `[앨범 수정 이미지 업로드 실패] ${file.name}:`,
                      uploadResponse.status,
                      uploadResponse.statusText
                    );
                  }
                } finally {
                  clearTimeout(timeoutId);
                }
              } else {
                console.error('[앨범 수정 Presign URL 없음]', responseData);
              }
            } else {
              console.warn(
                `[앨범 수정 Presign URL 요청 실패] ${file.name}:`,
                presignRes.status,
                presignRes.statusText
              );
            }
          } catch (error) {
            console.error(
              `[앨범 수정 이미지 업로드 오류] ${file.name}:`,
              error
            );
          }
        }
      }

      // 기존 이미지들과 새로 업로드된 이미지들을 합침
      const existingImages = [
        editFormData.imageUrl1,
        editFormData.imageUrl2,
        editFormData.imageUrl3,
      ].filter(Boolean);

      const allImages = [...existingImages, ...uploadedImageUrls];

      // 업데이트할 데이터 준비
      const updateData = {
        title: editFormData.title,
        content: editFormData.content,
        location: editFormData.location,
        memoryDate: editFormData.memoryDate,
        imageUrl1: allImages[0] || null,
        imageUrl2: allImages[1] || null,
        imageUrl3: allImages[2] || null,
      };

      const response = await fetch(`/api/groups/${groupId}/albums/${albumId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedAlbum = await response.json();
        setAlbumDetail(updatedAlbum);
        setShowEditModal(false);
        setImagePreviews([]);
        setSelectedFiles([]);

        // 새 이미지를 업로드한 경우에만 하루 제한 적용
        if (uploadedImageUrls.length > 0) {
          const today = new Date().toDateString();
          const groupUploadKey = `albumUpload_${groupId}_${today}`;
          localStorage.setItem(groupUploadKey, today);
          setCanUploadToday(false);
          setLastUploadDate(today);
        }

        alert('앨범이 수정되었습니다.');
      } else {
        const errorText = await response.text();
        console.error('[앨범 수정] API 오류:', response.status, errorText);

        if (response.status === 403) {
          alert('작성자만 수정할 수 있습니다.');
        } else {
          alert('앨범 수정에 실패했습니다.');
        }
      }
    } catch (err) {
      console.error('[앨범 수정 오류]', err);
      alert('앨범 수정 중 오류가 발생했습니다.');
    } finally {
      setIsEditing(false);
    }
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="group-album-detail-page h-screen flex flex-col py-24 px-4 mx-auto rounded-lg bg-gray-100">
        <div className="flex items-center mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-800"
            aria-label="뒤로가기"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
              aria-hidden="true"
              focusable="false"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
          </button>
          <h2 className="text-2xl font-semibold text-center flex-1">
            앨범 상세
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9477ff] mx-auto mb-4"></div>
            <p className="text-gray-600">앨범 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error || !albumDetail) {
    return (
      <div className="group-album-detail-page h-screen flex flex-col py-24 px-4 mx-auto rounded-lg bg-gray-100">
        <div className="flex items-center mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-800"
            aria-label="뒤로가기"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
              aria-hidden="true"
              focusable="false"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
          </button>
          <h2 className="text-2xl font-semibold text-center flex-1">
            앨범 상세
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold mb-2">
              앨범을 찾을 수 없습니다
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-[#9477ff] hover:bg-[#6845f5] text-white px-6 py-2 rounded-lg"
            >
              돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const imageUrls = getImageUrls(albumDetail);

  return (
    <div className="group-album-detail-page h-screen flex flex-col py-24 px-4 mx-auto rounded-lg bg-gray-100">
      <div className="mb-6">
        <div className="flex items-center mb-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-800"
            aria-label="뒤로가기"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
              aria-hidden="true"
              focusable="false"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
          </button>
          <h2 className="text-2xl font-semibold text-center flex-1">
            앨범 상세
          </h2>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={handleEditAlbum}
            className="text-xs text-white border border-purple-200 px-3 py-1.5 rounded-lg font-medium shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-300 hover:scale-105 active:scale-95 backdrop-blur-sm"
            style={
              {
                backgroundColor: '#aa96fc',
                '--hover-bg-color': '#8b5cf6',
              } as React.CSSProperties
            }
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#8b5cf6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#aa96fc';
            }}
          >
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="white"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                />
              </svg>
              <span>수정</span>
            </div>
          </button>
          <button
            onClick={handleDeleteAlbum}
            disabled={isDeleting}
            className="text-xs text-white border border-red-200 px-3 py-1.5 rounded-lg font-medium shadow-sm hover:shadow-md hover:border-red-300 transition-all duration-300 hover:scale-105 active:scale-95 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={
              {
                backgroundColor: '#f5b2b2',
                '--hover-bg-color': '#e89999',
              } as React.CSSProperties
            }
            onMouseEnter={(e) => {
              if (!isDeleting) {
                e.currentTarget.style.backgroundColor = '#e89999';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDeleting) {
                e.currentTarget.style.backgroundColor = '#f5b2b2';
              }
            }}
          >
            {isDeleting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>삭제 중...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="white"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
                <span>삭제</span>
              </div>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto scroll-overlay pb-20">
        {/* 제목 */}
        <div className="mb-4 p-4 bg-white rounded-lg shadow-sm">
          <label className="block mb-2 font-medium text-gray-700">제목</label>
          <h3 className="text-lg font-semibold text-gray-900">
            {albumDetail.title ||
              albumDetail.albumTitle ||
              albumDetail.memoryTitle ||
              `앨범 #${albumDetail.memoryId}`}
          </h3>
        </div>

        {/* 설명 */}
        <div className="mb-4 p-4 bg-white rounded-lg shadow-sm">
          <label className="block mb-2 font-medium text-gray-700">설명</label>
          <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
            {albumDetail.content ||
              albumDetail.albumContent ||
              albumDetail.memoryContent ||
              albumDetail.description}
          </div>
        </div>

        {/* 이미지 */}
        {imageUrls.length > 0 && (
          <div className="mb-4 p-4 bg-white rounded-lg shadow-sm">
            <label className="block mb-2 font-medium text-gray-700">
              이미지 ({imageUrls.length}장)
            </label>
            <div className="w-full">
              <div className="overflow-x-auto">
                <div
                  className="flex gap-2 py-2"
                  style={{ width: `${imageUrls.length * 120}px` }}
                >
                  {imageUrls.map((imageUrl, index) => (
                    <div
                      key={index}
                      className="relative flex-shrink-0 w-28 h-28"
                    >
                      <Image
                        src={imageUrl}
                        alt={`앨범 이미지 ${index + 1}`}
                        width={112}
                        height={112}
                        className="w-full h-full rounded-lg object-cover border border-gray-200"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 위치 */}
        <div className="mb-4 p-4 bg-white rounded-lg shadow-sm">
          <label className="block mb-2 font-medium text-gray-700">위치</label>
          <div className="text-gray-800 flex items-center gap-2">
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-gray-600">
              {albumDetail.location ||
                albumDetail.albumLocation ||
                albumDetail.memoryLocation ||
                albumDetail.place ||
                albumDetail.address ||
                '위치 정보 없음'}
            </span>
          </div>
        </div>

        {/* 추억 날짜 */}
        {albumDetail.memoryDate && (
          <div className="mb-4 p-4 bg-white rounded-lg shadow-sm">
            <label className="block mb-2 font-medium text-gray-700">
              추억 날짜
            </label>
            <div className="text-gray-800 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {formatDisplayDate(albumDetail.memoryDate)}
            </div>
          </div>
        )}

        {/* 생성일 */}
        {albumDetail.createdAt && (
          <div className="text-gray-600 text-sm" style={{ textAlign: 'right' }}>
            생성일: {formatDisplayDate(albumDetail.createdAt)}
          </div>
        )}
      </div>

      {/* 수정 모달 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="p-6 flex-shrink-0">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  앨범 수정
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-6 flex-1 overflow-y-auto">
              <div className="space-y-4">
                {/* 제목 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    제목 *
                  </label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        title: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="제목을 입력하세요"
                  />
                </div>

                {/* 내용 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    내용
                  </label>
                  <textarea
                    value={editFormData.content}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        content: e.target.value,
                      })
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="내용을 입력하세요"
                  />
                </div>

                {/* 위치 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    위치
                  </label>
                  <input
                    type="text"
                    value={editFormData.location}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        location: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="위치를 입력하세요"
                  />
                </div>

                {/* 추억 날짜 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    추억 날짜
                  </label>
                  <input
                    type="date"
                    value={editFormData.memoryDate}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        memoryDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* 이미지 첨부 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이미지 첨부 ({imagePreviews.length}/3장)
                    {!canUploadToday && (
                      <span className="text-red-500 text-xs ml-2">
                        (오늘 업로드 완료)
                      </span>
                    )}
                  </label>
                  <div className="flex flex-col items-center gap-4">
                    {/* 이미지 미리보기 슬라이더 */}
                    {imagePreviews.length > 0 ? (
                      <div className="w-full">
                        <div className="overflow-x-auto">
                          <div
                            className="flex gap-2 py-2"
                            style={{ width: `${imagePreviews.length * 120}px` }}
                          >
                            {imagePreviews.map((preview, index) => (
                              <div
                                key={index}
                                className="relative flex-shrink-0 w-28 h-28"
                              >
                                <Image
                                  src={preview}
                                  alt={`미리보기 ${index + 1}`}
                                  width={112}
                                  height={112}
                                  className="w-full h-full rounded-lg object-cover border border-gray-200"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                          <svg
                            className="w-12 h-12 text-gray-400 mx-auto mb-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="text-gray-500 text-sm">
                            이미지를 선택해주세요
                          </p>
                          <p className="text-gray-400 text-xs mt-1">
                            여러 장 선택 가능
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 파일 선택 버튼 */}
                    <div className="w-full">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                        id="edit-image-upload"
                        disabled={!canUploadToday}
                      />
                      <label
                        htmlFor="edit-image-upload"
                        className={`w-full py-2 px-4 rounded-lg text-center block transition-colors ${
                          canUploadToday
                            ? 'bg-[#9477ff] hover:bg-[#6845f5] text-white cursor-pointer'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {!canUploadToday
                          ? `오늘 업로드 완료 (${lastUploadDate})`
                          : imagePreviews.length > 0
                            ? '이미지 추가'
                            : '이미지 선택'}
                      </label>
                      {!canUploadToday && (
                        <p className="text-xs text-gray-500 mt-1 text-center">
                          하루에 1개의 앨범만 업로드할 수 있습니다.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 flex-shrink-0 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleUpdateAlbum}
                  disabled={isEditing}
                  className="flex-1 px-4 py-2 text-white border border-purple-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={
                    {
                      backgroundColor: '#6845f5',
                      '--hover-bg-color': '#5b35e0',
                    } as React.CSSProperties
                  }
                  onMouseEnter={(e) => {
                    if (!isEditing) {
                      e.currentTarget.style.backgroundColor = '#5b35e0';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isEditing) {
                      e.currentTarget.style.backgroundColor = '#6845f5';
                    }
                  }}
                >
                  {isEditing ? '수정 중...' : '수정'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AlbumDetail() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AlbumDetailContent />
    </Suspense>
  );
}
