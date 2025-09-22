# 스케줄링 시스템 (`what_time`) 기술 명세서

## 1. 개요 (Overview)

이 문서는 '다짐 광고' SaaS의 촬영일 스케줄링 기능 구현을 위한 기술 명세를 정의합니다.

본 시스템은 **'미리 생성된 슬롯 (Pre-generated Slot)'** 모델을 기반으로 합니다. 이 모델은 구현의 단순성과 명확성에 중점을 두어, 개발 속도를 높이고 안정성을 확보하는 것을 목표로 합니다.

- **핵심 개념:** 1시간 단위의 모든 시간 슬롯을 데이터베이스에 미리 생성해두고, 각 슬롯의 상태를 변경하며 사용자와 관리자가 소통합니다.
- **시간 정책:** 시스템의 모든 시간 데이터는 애플리케이션 레벨에서 **한국 표준시(KST)를 기준**으로 처리합니다.

### 1.1. 아키텍처 결정 (Architectural Decision)

초기에는 클라이언트에서 Supabase Edge Function (`functions.invoke`)을 호출하는 방식을 고려했으나, `SupabaseProvider`를 통한 인증 토큰 자동 주입이 일관되게 동작하지 않아 고질적인 401 Unauthorized 오류가 발생했습니다.

이를 해결하기 위해, 클라이언트에서 호출하는 모든 백엔드 로직은 **데이터베이스 SQL RPC 함수**로 구현하고, 클라이언트에서는 `supabase.rpc()`를 통해 호출하는 것으로 아키텍처를 변경했습니다. 이 방식은 `supabase.from().select()`와 동일한 인증 경로를 사용하므로 인증이 안정적으로 동작하는 것이 확인되었습니다.

---

## 2. 데이터 모델 (Data Model)

### 2.1. `time_slots` 테이블 (신규 생성)

시스템의 중심이 되는 테이블로, 모든 시간 슬롯의 정보와 상태를 관리합니다.

| 컬럼명 | 타입 | 필수 | 설명 |
| :--- | :--- | :--- | :--- |
| `id` | `bigint` (PK) | O | 고유 식별자 (Auto-increment) |
| `slot_time` | `timestampz` | O | 슬롯의 시작 시간 (타임존 포함, 예: `2025-10-23 14:00:00+09`) |
| `is_open` | `boolean` | O | **관리자가 오픈한 시간인지 여부.** `false`이면 어떤 사용자도 선택할 수 없음. (기본값: `true`) |
| `booking_status` | `text` | O | **슬롯의 예약 상태.** (기본값: `'available'`)<br>- `available`: 예약 가능<br>- `requested`: 센터가 예약 요청<br>- `confirmed`: 관리자가 예약 확정 |
| `project_id` | `uuid` (FK) | X | 이 슬롯을 점유(요청/확정)한 프로젝트의 ID. `projects.id`와 연결. |

### 2.2. 관련 테이블 (기존 테이블 활용)

- **`projects` 테이블:**
    - `shootdate` (`date`): 관리자가 특정 슬롯을 `confirmed` 상태로 변경할 때, 해당 슬롯의 날짜(`slot_time`)가 이 컬럼에 최종적으로 기록됩니다.
    - `status` (`text`): 스케줄링 워크플로우에 따라 상태가 변경됩니다. (예: `script_submitted` -> `schedule_requested` -> `schedule_confirmed`)

- **`user_profiles` 테이블:**
    - 역할(Role)은 Clerk JWT의 `public_metadata`에 포함된 `is_admin` (boolean) 값을 통해 관리됩니다. `is_admin`이 `true`가 아니면 모두 `center`로 간주하며, 이는 Supabase RLS(Row Level Security) 정책에 의해 제어됩니다. 별도의 `role` 컬럼은 사용하지 않습니다.

### 2.3. 테이블 관계 (Table Relationships)

- `time_slots.project_id`는 `projects.id`를 참조합니다. (One-to-Many: 하나의 프로젝트가 여러 개의 시간 슬롯을 `requested` 상태로 가질 수 있음)

---

## 3. 핵심 RPC 함수 및 로직 (Core RPC Functions & Logic)

모든 백엔드 로직은 클라이언트에서 `supabase.rpc()`로 호출되는 아래의 SQL 함수들로 구현됩니다.

#### `generate_slots_for_date(date)`
- **역할:** SQL 전용 헬퍼 함수.
- **설명:** 특정 날짜에 대한 24개의 시간 슬롯을 `time_slots` 테이블에 생성합니다. `manual_generate_slots` RPC를 통해 간접적으로 호출됩니다.

#### `manual_generate_slots(p_target_date)`
- **역할:** 관리자용 RPC.
- **설명:** 관리자가 수동으로 특정 날짜의 슬롯을 생성합니다. 내부적으로 관리자 권한을 확인합니다.

#### `get_all_slots(p_start_date, p_end_date)`
- **역할:** 관리자용 RPC.
- **설명:** 관리자가 특정 기간의 모든 슬롯 정보를 조회합니다. 내부적으로 관리자 권한을 확인합니다.

#### `request_schedule_slots(p_project_id, p_slot_ids, p_user_id)`
- **역할:** 클라이언트(센터)용 RPC.
- **설명:** 사용자가 원하는 시간 슬롯 예약을 요청합니다. 내부적으로 프로젝트 소유권을 확인하며, 여러 데이터 업데이트를 트랜잭션으로 처리합니다.

#### `confirm_schedule_slot(p_project_id, p_confirmed_slot_id)`
- **역할:** 관리자용 RPC.
- **설명:** 관리자가 사용자가 요청한 슬롯 중 하나를 최종 촬영일로 확정합니다. 관련 데이터 업데이트를 트랜잭션으로 처리합니다.

#### `update_slot_availability(p_slot_ids, p_is_open)`
- **역할:** 관리자용 RPC.
- **설명:** 관리자가 특정 시간 슬롯들의 예약 가능 여부(`is_open`)를 일괄 변경합니다. 내부적으로 관리자 권한 및 슬롯 상태를 확인하여 안전하게 처리합니다.
